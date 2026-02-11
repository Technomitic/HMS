import { Module } from '@nestjs/common';
import { HipaaAuditService } from './hipaa-audit.service';
import { HipaaAccessGuard } from './hipaa-access.guard';
import { PhiAccessInterceptor } from './phi-access.interceptor';

@Module({
  providers: [HipaaAuditService, HipaaAccessGuard, PhiAccessInterceptor],
  exports: [HipaaAuditService, HipaaAccessGuard, PhiAccessInterceptor],
})
export class HipaaModule {}