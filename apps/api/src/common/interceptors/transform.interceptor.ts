import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();

    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse();
        const request = context.switchToHttp().getRequest();

        // Don't transform if already formatted or if it's a raw response
        if (data?.data !== undefined || response.headersSent) {
          return data;
        }

        return {
          data,
          meta: {
            requestId: request.headers['x-request-id'],
            duration: `${Date.now() - now}ms`,
          },
        };
      }),
    );
  }
}