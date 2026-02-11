import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { NotificationService } from '../notification/notification.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentStatusDto,
  AddClinicalNotesDto,
} from './dto/appointment.dto';
import { PaginationDto, paginate, buildPaginationMeta } from '../../common/dto/pagination.dto';
import * as crypto from 'crypto';

@Injectable()
export class AppointmentService {
  private readonly logger = new Logger(AppointmentService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private notifications: NotificationService,
  ) {}

  async create(patientUserId: string, dto: CreateAppointmentDto) {
    // Get patient record
    const patient = await this.prisma.patient.findUnique({
      where: { userId: patientUserId },
    });
    if (!patient) throw new NotFoundException('Patient profile required before booking');

    // Verify doctor exists
    const doctor = await this.prisma.user.findFirst({
      where: { id: dto.doctorId, role: 'DOCTOR', isActive: true },
      include: { doctorProfile: true },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');

    // Check slot availability
    const slotStart = new Date(dto.slotStart);
    const slotEnd = new Date(dto.slotEnd);

    if (slotStart >= slotEnd) {
      throw new BadRequestException('Invalid slot: end must be after start');
    }

    if (slotStart <= new Date()) {
      throw new BadRequestException('Cannot book slots in the past');
    }

    const conflicting = await this.prisma.appointment.findFirst({
      where: {
        doctorId: dto.doctorId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        OR: [
          { slotStart: { lt: slotEnd }, slotEnd: { gt: slotStart } },
        ],
      },
    });

    if (conflicting) {
      throw new ConflictException('Selected slot is not available');
    }

    // Generate QR code hash
    const qrCodeHash = crypto
      .createHash('sha256')
      .update(`${patient.id}-${dto.doctorId}-${slotStart.toISOString()}-${Date.now()}`)
      .digest('hex');

    const appointment = await this.prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: dto.doctorId,
        department: dto.department as any,
        slotStart,
        slotEnd,
        type: (dto.type as any) || 'OPD',
        status: 'CONFIRMED',
        qrCodeHash,
        chiefComplaint: dto.chiefComplaint,
      },
      include: {
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true } },
          },
        },
        doctor: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    // Send notification
    await this.notifications.send({
      userId: patientUserId,
      channel: 'EMAIL',
      title: 'Appointment Confirmed',
      body: `Your appointment with Dr. ${doctor.firstName} ${doctor.lastName} is confirmed for ${slotStart.toLocaleDateString()} at ${slotStart.toLocaleTimeString()}.`,
      data: {
        appointmentId: appointment.id,
        qrCodeHash,
      },
    });

    // Cache slot unavailability
    await this.redis.set(
      `slot:${dto.doctorId}:${slotStart.toISOString()}`,
      appointment.id,
      86400,
    );

    this.logger.log(`Appointment created: ${appointment.id}`);

    return {
      data: {
        ...appointment,
        qrCodeUrl: `/api/v1/appointments/${appointment.id}/qr`,
      },
    };
  }

  async findAll(
    query: PaginationDto & {
      status?: string;
      doctorId?: string;
      patientId?: string;
      date?: string;
      department?: string;
    },
  ) {
    const { page = 1, limit = 20, status, doctorId, patientId, date, department } = query;

    const where: any = {};
    if (status) where.status = status;
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;
    if (department) where.department = department;
    if (date) {
      const dayStart = new Date(date);
      const dayEnd = new Date(date);
      dayEnd.setDate(dayEnd.getDate() + 1);
      where.slotStart = { gte: dayStart, lt: dayEnd };
    }

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        ...paginate(page, limit),
        include: {
          patient: {
            include: {
              user: { select: { firstName: true, lastName: true, avatarUrl: true } },
            },
          },
          doctor: { select: { firstName: true, lastName: true } },
        },
        orderBy: { slotStart: 'asc' },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      data: appointments,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true } },
          },
        },
        doctor: { select: { id: true, firstName: true, lastName: true, email: true } },
        labReports: true,
        invoices: true,
      },
    });

    if (!appointment) throw new NotFoundException('Appointment not found');
    return { data: appointment };
  }

  async updateStatus(id: string, dto: UpdateAppointmentStatusDto) {
    const appointment = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: dto.status as any,
        notes: dto.notes,
      },
      include: {
        patient: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });

    // Notify patient on status changes
    if (['CANCELLED', 'COMPLETED'].includes(dto.status)) {
      await this.notifications.send({
        userId: appointment.patient.userId,
        channel: 'IN_APP',
        title: `Appointment ${dto.status.toLowerCase()}`,
        body: `Your appointment #${id.slice(0, 8)} has been ${dto.status.toLowerCase()}.`,
        data: { appointmentId: id },
      });
    }

    return { data: appointment };
  }

  async addClinicalNotes(id: string, doctorId: string, dto: AddClinicalNotesDto) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, doctorId },
    });

    if (!appointment) throw new NotFoundException('Appointment not found or unauthorized');

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        notes: dto.notes,
        diagnosis: dto.diagnosis,
        vitals: dto.vitals as any,
        prescription: dto.prescription as any,
      },
    });

    return { data: updated };
  }

  async checkIn(qrCodeHash: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { qrCodeHash },
    });

    if (!appointment) throw new NotFoundException('Invalid QR code');
    if (appointment.status !== 'CONFIRMED') {
      throw new BadRequestException(`Cannot check in: status is ${appointment.status}`);
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: 'CHECKED_IN' },
      include: {
        patient: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        doctor: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Notify doctor
    await this.notifications.send({
      userId: updated.doctorId,
      channel: 'IN_APP',
      title: 'Patient Checked In',
      body: `${updated.patient.user.firstName} ${updated.patient.user.lastName} has arrived.`,
      data: { appointmentId: updated.id },
    });

    return { data: updated };
  }

  async getDoctorSchedule(doctorId: string, date: string) {
    const dayStart = new Date(date);
    const dayEnd = new Date(date);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        slotStart: { gte: dayStart, lt: dayEnd },
        status: { notIn: ['CANCELLED'] },
      },
      include: {
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { slotStart: 'asc' },
    });

    return { data: appointments };
  }

  async getAvailableSlots(doctorId: string, date: string) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorId },
    });

    if (!profile) throw new NotFoundException('Doctor profile not found');

    const dayStart = new Date(date);
    const dayEnd = new Date(date);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const bookedAppointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        slotStart: { gte: dayStart, lt: dayEnd },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
      select: { slotStart: true, slotEnd: true },
    });

    // Generate 30-min slots from 9 AM to 5 PM
    const slots = [];
    const schedule = profile.schedule as any;
    const dayOfWeek = dayStart.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    for (let hour = 9; hour < 17; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const slotStart = new Date(dayStart);
        slotStart.setHours(hour, min, 0, 0);
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + 30);

        const isBooked = bookedAppointments.some(
          (apt) =>
            new Date(apt.slotStart) < slotEnd &&
            new Date(apt.slotEnd) > slotStart,
        );

        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          available: !isBooked,
        });
      }
    }

    return { data: slots };
  }
}