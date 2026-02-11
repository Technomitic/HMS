import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PatientService } from './patient.service';
import { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { JwtAuthGuard, JwtPayload } from '../../common/guards/jwt-auth.guard';

@ApiTags('patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(AuditInterceptor)
@Controller('patients')
export class PatientController {
  constructor(private patientService: PatientService) {}

  @Post()
  @ApiOperation({ summary: 'Create patient profile for current user' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePatientDto,
  ) {
    return this.patientService.create(user.sub, dto);
  }

  @Get()
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR')
  @ApiOperation({ summary: 'List all patients (admin/staff)' })
  async findAll(@Query() query: PaginationDto & { search?: string }) {
    return this.patientService.findAll(query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current patient profile' })
  async findMe(@CurrentUser() user: JwtPayload) {
    return this.patientService.findByUserId(user.sub);
  }

  @Get(':id')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR')
  @ApiOperation({ summary: 'Get patient by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.patientService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update patient profile' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePatientDto,
  ) {
    return this.patientService.update(id, dto);
  }
}