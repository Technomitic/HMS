import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { NotificationService } from '../notification/notification.service';
import { PaginationDto, paginate, buildPaginationMeta } from '../../common/dto/pagination.dto';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private notifications: NotificationService,
  ) {}

  async createInvoice(dto: {
    appointmentId: string;
    patientId: string;
    items: { description: string; category: string; quantity: number; unitPriceCents: number }[];
    dueDate: string;
    taxRate?: number;
    discountCents?: number;
  }) {
    const items = dto.items.map((item) => ({
      ...item,
      totalCents: item.quantity * item.unitPriceCents,
    }));

    const subtotalCents = items.reduce((sum, item) => sum + item.totalCents, 0);
    const taxCents = Math.round(subtotalCents * (dto.taxRate || 0.08));
    const discountCents = dto.discountCents || 0;
    const totalCents = subtotalCents + taxCents - discountCents;

    const invoiceNumber = await this.generateInvoiceNumber();

    const invoice = await this.prisma.invoice.create({
      data: {
        appointmentId: dto.appointmentId,
        patientId: dto.patientId,
        invoiceNumber,
        items: items as any,
        subtotalCents,
        taxCents,
        discountCents,
        totalCents,
        status: 'UNPAID',
        dueDate: new Date(dto.dueDate),
      },
      include: {
        patient: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
      },
    });

    // Notify patient
    await this.notifications.send({
      userId: invoice.patient.userId,
      channel: 'EMAIL',
      title: 'New Invoice Generated',
      body: `Invoice ${invoiceNumber} for $${(totalCents / 100).toFixed(2)} is due on ${new Date(dto.dueDate).toLocaleDateString()}.`,
      data: { invoiceId: invoice.id },
    });

    this.logger.log(`Invoice created: ${invoiceNumber}`);
    return { data: invoice };
  }

  async findAll(query: PaginationDto & { status?: string; patientId?: string }) {
    const { page = 1, limit = 20, status, patientId } = query;
    const where: any = {};
    if (status) where.status = status;
    if (patientId) where.patientId = patientId;

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        ...paginate(page, limit),
        include: {
          patient: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { data: invoices, meta: buildPaginationMeta(page, limit, total) };
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: {
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        },
        appointment: true,
      },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');
    return { data: invoice };
  }

  async markPaid(id: string, paymentMethod: string) {
    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paymentMethod,
      },
    });

    return { data: invoice };
  }

  async getPatientBillingSummary(patientId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });

    const totalBilled = invoices.reduce((s, i) => s + i.totalCents, 0);
    const totalPaid = invoices
      .filter((i) => i.status === 'PAID')
      .reduce((s, i) => s + i.totalCents, 0);
    const totalOutstanding = invoices
      .filter((i) => i.status === 'UNPAID')
      .reduce((s, i) => s + i.totalCents, 0);

    return {
      data: {
        totalBilledCents: totalBilled,
        totalPaidCents: totalPaid,
        totalOutstandingCents: totalOutstanding,
        invoiceCount: invoices.length,
        recentInvoices: invoices.slice(0, 10),
      },
    };
  }

  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const counter = await this.redis.increment(`invoice:counter:${year}${month}`);
    return `INV-${year}${month}-${String(counter).padStart(5, '0')}`;
  }
}