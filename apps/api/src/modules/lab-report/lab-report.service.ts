import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { PaginationDto, paginate, buildPaginationMeta } from '../../common/dto/pagination.dto';

@Injectable()
export class LabReportService {
  private readonly logger = new Logger(LabReportService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationService,
  ) {}

  async createOrder(dto: {
    appointmentId: string;
    patientId: string;
    orderedBy: string;
    testType: string;
    testCategory: string;
    notes?: string;
  }) {
    const report = await this.prisma.labReport.create({
      data: {
        appointmentId: dto.appointmentId,
        patientId: dto.patientId,
        orderedBy: dto.orderedBy,
        testType: dto.testType,
        testCategory: dto.testCategory as any,
        notes: dto.notes,
        status: 'ORDERED',
      },
      include: {
        patient: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        orderedByUser: { select: { firstName: true, lastName: true } },
      },
    });

    this.logger.log(`Lab order created: ${report.id} (${dto.testType})`);
    return { data: report };
  }

  async updateStatus(id: string, status: string, results?: any, reportPdfUrl?: string) {
    const report = await this.prisma.labReport.update({
      where: { id },
      data: {
        status: status as any,
        results: results || undefined,
        reportPdfUrl: reportPdfUrl || undefined,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
      },
      include: {
        patient: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });

    if (status === 'COMPLETED') {
      await this.notifications.send({
        userId: report.patient.userId,
        channel: 'PUSH',
        title: 'Lab Report Ready',
        body: `Your ${report.testType} report is ready. View it in your portal.`,
        data: { labReportId: report.id },
      });
    }

    return { data: report };
  }

  async findByPatient(patientId: string, query: PaginationDto) {
    const { page = 1, limit = 20 } = query;
    const [reports, total] = await Promise.all([
      this.prisma.labReport.findMany({
        where: { patientId },
        ...paginate(page, limit),
        orderBy: { createdAt: 'desc' },
        include: {
          orderedByUser: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.labReport.count({ where: { patientId } }),
    ]);

    return { data: reports, meta: buildPaginationMeta(page, limit, total) };
  }

  async findAll(query: PaginationDto & { status?: string }) {
    const { page = 1, limit = 20, status } = query;
    const where: any = {};
    if (status) where.status = status;

    const [reports, total] = await Promise.all([
      this.prisma.labReport.findMany({
        where,
        ...paginate(page, limit),
        orderBy: { createdAt: 'desc' },
        include: {
          patient: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
          orderedByUser: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.labReport.count({ where }),
    ]);

    return { data: reports, meta: buildPaginationMeta(page, limit, total) };
  }

  async findOne(id: string) {
    const report = await this.prisma.labReport.findUnique({
      where: { id },
      include: {
        patient: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        orderedByUser: { select: { firstName: true, lastName: true } },
        appointment: true,
      },
    });

    if (!report) throw new NotFoundException('Lab report not found');
    return { data: report };
  }
}