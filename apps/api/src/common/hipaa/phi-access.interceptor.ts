import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { HipaaAuditService } from './hipaa-audit.service';

/**
 * Automatically logs PHI access on patient-related endpoints
 * Apply with @UseInterceptors(PhiAccessInterceptor) on sensitive routes
 */
@Injectable()
export class PhiAccessInterceptor implements NestInterceptor {
  constructor(private hipaaAudit: HipaaAuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const method = request.method;
    const path = request.route?.path || request.url;
    const startTime = Date.now();

    const actionMap: Record<string, 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE'> = {
      GET: 'VIEW',
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };

    return next.handle().pipe(
      tap({
        next: async (data) => {
          if (!user) return;

          // Determine if this accesses PHI
          const isPhiRoute =
            path.includes('patient') ||
            path.includes('lab-report') ||
            path.includes('appointment') ||
            path.includes('billing') ||
            path.includes('prescription');

          if (isPhiRoute) {
            const resourceId =
              request.params.id ||
              data?.data?.id ||
              'collection';

            const patientId =
              request.params.patientId ||
              data?.data?.patientId ||
              data?.data?.patient?.id;

            await this.hipaaAudit.logPhiAccess({
              userId: user.sub,
              action: actionMap[method] || 'VIEW',
              resourceType: this.getResourceType(path),
              resourceId: String(resourceId),
              patientId: patientId ? String(patientId) : undefined,
              ipAddress: request.ip || '0.0.0.0',
              userAgent: request.headers['user-agent'] || 'unknown',
              details: `${method} ${path} — ${Date.now() - startTime}ms`,
              outcome: 'SUCCESS',
            });
          }
        },
        error: async (error) => {
          if (!user) return;

          await this.hipaaAudit.logPhiAccess({
            userId: user.sub,
            action: actionMap[method] || 'VIEW',
            resourceType: this.getResourceType(path),
            resourceId: request.params.id || 'unknown',
            ipAddress: request.ip || '0.0.0.0',
            userAgent: request.headers['user-agent'] || 'unknown',
            details: `FAILED: ${error.message}`,
            outcome: 'FAILURE',
          });
        },
      }),
    );
  }

  private getResourceType(path: string): any {
    if (path.includes('lab-report')) return 'LAB_REPORT';
    if (path.includes('prescription')) return 'PRESCRIPTION';
    if (path.includes('billing') || path.includes('invoice')) return 'BILLING';
    if (path.includes('appointment')) return 'APPOINTMENT';
    return 'PHI';
  }
}