import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle().pipe(
        tap(async (responseData) => {
          try {
            const user = request.user;
            if (!user) return;

            const resourceId = request.params.id || responseData?.data?.id || 'unknown';
            const path = request.route?.path || request.url;

            await this.prisma.auditLog.create({
              data: {
                userId: user.sub,
                action: `${method} ${path}`,
                resourceType: this.extractResourceType(path),
                resourceId: String(resourceId),
                changes: method === 'DELETE' ? null : request.body,
                ipAddress: request.ip || request.connection?.remoteAddress || '0.0.0.0',
                userAgent: request.headers['user-agent'] || 'unknown',
              },
            });
          } catch (error) {
            console.error('Audit log failed:', error);
          }
        }),
      );
    }

    return next.handle();
  }

  private extractResourceType(path: string): string {
    const segments = path.split('/').filter(Boolean);
    return segments[2] || segments[1] || 'unknown';
  }
}