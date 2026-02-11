import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface HipaaAuditEntry {
  userId: string;
  action: 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'PRINT';
  resourceType: 'PHI' | 'APPOINTMENT' | 'LAB_REPORT' | 'PRESCRIPTION' | 'BILLING';
  resourceId: string;
  patientId?: string;
  ipAddress: string;
  userAgent: string;
  details?: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'DENIED';
}

@Injectable()
export class HipaaAuditService {
  private readonly logger = new Logger(HipaaAuditService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Log every access to Protected Health Information (PHI)
   * Required by HIPAA §164.312(b) - Audit Controls
   */
  async logPhiAccess(entry: HipaaAuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: entry.userId,
          action: `HIPAA:${entry.action}:${entry.resourceType}`,
          resourceType: entry.resourceType.toLowerCase(),
          resourceId: entry.resourceId,
          changes: {
            hipaaAction: entry.action,
            patientId: entry.patientId,
            outcome: entry.outcome,
            details: entry.details,
            timestamp: new Date().toISOString(),
          },
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
        },
      });
    } catch (error) {
      // HIPAA audit logging must never silently fail
      this.logger.error('CRITICAL: HIPAA audit log failed', error);
      // In production, send alert to security team
      // await this.alertService.sendCritical('HIPAA audit log failure', error);
    }
  }

  /**
   * Log emergency access (break-the-glass)
   */
  async logEmergencyAccess(
    userId: string,
    patientId: string,
    reason: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<void> {
    this.logger.warn(
      `EMERGENCY ACCESS: User ${userId} accessed patient ${patientId} — Reason: ${reason}`,
    );

    await this.logPhiAccess({
      userId,
      action: 'VIEW',
      resourceType: 'PHI',
      resourceId: patientId,
      patientId,
      ipAddress,
      userAgent,
      details: `EMERGENCY ACCESS: ${reason}`,
      outcome: 'SUCCESS',
    });
  }

  /**
   * Generate HIPAA compliance report
   */
  async generateAccessReport(
    startDate: Date,
    endDate: Date,
    patientId?: string,
  ) {
    const where: any = {
      action: { startsWith: 'HIPAA:' },
      createdAt: { gte: startDate, lte: endDate },
    };

    if (patientId) {
      where.changes = { path: ['patientId'], equals: patientId };
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, role: true },
        },
      },
    });

    return {
      reportDate: new Date().toISOString(),
      period: { start: startDate, end: endDate },
      totalAccesses: logs.length,
      accessesByUser: this.groupBy(logs, 'userId'),
      accessesByType: this.groupBy(logs, 'action'),
      entries: logs.map((log) => ({
        timestamp: log.createdAt,
        user: `${log.user.firstName} ${log.user.lastName} (${log.user.role})`,
        action: log.action,
        resource: log.resourceType,
        ip: log.ipAddress,
        outcome: (log.changes as any)?.outcome,
      })),
    };
  }

  private groupBy(items: any[], key: string): Record<string, number> {
    return items.reduce((acc, item) => {
      const val = item[key];
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
  }
}