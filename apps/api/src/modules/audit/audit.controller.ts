import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'View audit logs (admin only)' })
  async findAll(
    @Query()
    query: PaginationDto & {
      userId?: string;
      action?: string;
      resourceType?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    return this.auditService.findAll(query);
  }
}