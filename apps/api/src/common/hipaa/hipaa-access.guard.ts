import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HipaaAuditService } from './hipaa-audit.service';

/**
 * Enforces "minimum necessary" HIPAA principle
 * Doctors can only access patients they have appointments with
 * Patients can only access their own data
 */
@Injectable()
export class HipaaAccessGuard implements CanActivate {
  private readonly logger = new Logger(HipaaAccessGuard.name);

  constructor(
    private prisma: PrismaService,
    private hipaaAudit: HipaaAuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;

    // Admins have broad access (still logged)
    if (user.role === 'ADMIN') return true;

    const patientId = request.params.patientId || request.params.id;
    if (!patientId) return true; // Collection endpoints handled by RBAC

    // PATIENT: Can only access own data
    if (user.role === 'PATIENT') {
      const patient = await this.prisma.patient.findUnique({
        where: { userId: user.sub },
        select: { id: true },
      });

      if (!patient || patient.id !== patientId) {
        await this.hipaaAudit.logPhiAccess({
          userId: user.sub,
          action: 'VIEW',
          resourceType: 'PHI',
          resourceId: patientId,
          patientId,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'] || 'unknown',
          details: 'ACCESS DENIED: Patient tried to access other patient data',
          outcome: 'DENIED',
        });
        throw new ForbiddenException('Access denied');
      }
    }

    // DOCTOR: Can only access patients they have appointments with
    if (user.role === 'DOCTOR') {
      const hasRelationship = await this.prisma.appointment.findFirst({
        where: {
          doctorId: user.sub,
          patientId,
        },
      });

      if (!hasRelationship) {
        await this.hipaaAudit.logPhiAccess({
          userId: user.sub,
          action: 'VIEW',
          resourceType: 'PHI',
          resourceId: patientId,
          patientId,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'] || 'unknown',
          details: 'ACCESS DENIED: Doctor has no appointment relationship with patient',
          outcome: 'DENIED',
        });

        this.logger.warn(
          `HIPAA: Doctor ${user.sub} attempted unauthorized access to patient ${patientId}`,
        );
        throw new ForbiddenException('Access denied');
      }
    }

    return true;
  }
}