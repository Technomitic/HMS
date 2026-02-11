import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentService } from './appointment.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentStatusDto,
  AddClinicalNotesDto,
} from './dto/appointment.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { JwtPayload } from '../../common/guards/jwt-auth.guard';
import { Res } from '@nestjs/common';
import { Response } from 'express';

@ApiTags('appointments')
@ApiBearerAuth()
@UseInterceptors(AuditInterceptor)
@Controller('appointments')
export class AppointmentController {
  constructor(private appointmentService: AppointmentService) {}

  @Post()
  @ApiOperation({ summary: 'Book a new appointment' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointmentService.create(user.sub, dto);
  }

  @Get()
  @Roles('ADMIN', 'RECEPTIONIST')
  @ApiOperation({ summary: 'List all appointments (admin/receptionist)' })
  async findAll(
    @Query() query: PaginationDto & {
      status?: string;
      doctorId?: string;
      date?: string;
      department?: string;
    },
  ) {
    return this.appointmentService.findAll(query);
  }

  @Get('doctor/schedule')
  @Roles('DOCTOR')
  @ApiOperation({ summary: 'Get doctor schedule for a date' })
  async doctorSchedule(
    @CurrentUser() user: JwtPayload,
    @Query('date') date: string,
  ) {
    return this.appointmentService.getDoctorSchedule(user.sub, date || new Date().toISOString().split('T')[0]);
  }

  @Get('slots/:doctorId')
  @ApiOperation({ summary: 'Get available slots for a doctor on a date' })
  async availableSlots(
    @Param('doctorId', ParseUUIDPipe) doctorId: string,
    @Query('date') date: string,
  ) {
    return this.appointmentService.getAvailableSlots(doctorId, date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment details' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentService.findOne(id);
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR')
  @ApiOperation({ summary: 'Update appointment status' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentService.updateStatus(id, dto);
  }

  @Put(':id/clinical-notes')
  @Roles('DOCTOR')
  @ApiOperation({ summary: 'Add clinical notes, vitals, prescription' })
  async addClinicalNotes(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: AddClinicalNotesDto,
  ) {
    return this.appointmentService.addClinicalNotes(id, user.sub, dto);
  }

  @Post('check-in/:qrHash')
  @Roles('RECEPTIONIST', 'ADMIN')
  @ApiOperation({ summary: 'Check in patient via QR code hash' })
  async checkIn(@Param('qrHash') qrHash: string) {
    return this.appointmentService.checkIn(qrHash);
  }

  @Post(':id/discharge')
  @Roles('DOCTOR')
  @ApiOperation({ summary: 'Generate discharge summary' })
  async generateDischarge(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const appointment = await this.appointmentService.findOne(id);

    // Update status to completed
    await this.appointmentService.updateStatus(id, {
      status: 'COMPLETED',
      notes: 'Patient discharged',
    });

    const pdfService = new (await import('../pdf/pdf.service')).PdfService();
    const buffer = await pdfService.generateDischargeSummaryPdf(appointment.data);

    res.set({
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="discharge-${id.slice(0, 8)}.html"`,
    });
    res.send(buffer);
  }
}