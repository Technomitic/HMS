import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LabReportService } from './lab-report.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { JwtPayload } from '../../common/guards/jwt-auth.guard';

@ApiTags('lab-reports')
@ApiBearerAuth()
@UseInterceptors(AuditInterceptor)
@Controller('lab-reports')
export class LabReportController {
  constructor(private labReportService: LabReportService) {}

  @Post()
  @Roles('DOCTOR')
  @ApiOperation({ summary: 'Create a lab order' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: { appointmentId: string; patientId: string; testType: string; testCategory: string; notes?: string },
  ) {
    return this.labReportService.createOrder({
      ...dto,
      orderedBy: user.sub,
    });
  }

  @Get()
  @Roles('ADMIN', 'LAB_TECH')
  @ApiOperation({ summary: 'List all lab reports' })
  async findAll(@Query() query: PaginationDto & { status?: string }) {
    return this.labReportService.findAll(query);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get lab reports for a patient' })
  async findByPatient(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query() query: PaginationDto,
  ) {
    return this.labReportService.findByPatient(patientId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lab report details' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.labReportService.findOne(id);
  }

  @Patch(':id/status')
  @Roles('LAB_TECH', 'ADMIN')
  @ApiOperation({ summary: 'Update lab report status and results' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { status: string; results?: any; reportPdfUrl?: string },
  ) {
    return this.labReportService.updateStatus(id, dto.status, dto.results, dto.reportPdfUrl);
  }
}