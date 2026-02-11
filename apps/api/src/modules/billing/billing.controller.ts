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
import { BillingService } from './billing.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { Res } from '@nestjs/common';
import { Response } from 'express';

@ApiTags('billing')
@ApiBearerAuth()
@UseInterceptors(AuditInterceptor)
@Controller('billing')
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Post('invoices')
  @Roles('ADMIN', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Create a new invoice' })
  async create(
    @Body() dto: {
      appointmentId: string;
      patientId: string;
      items: { description: string; category: string; quantity: number; unitPriceCents: number }[];
      dueDate: string;
      taxRate?: number;
      discountCents?: number;
    },
  ) {
    return this.billingService.createInvoice(dto);
  }

  @Get('invoices')
  @Roles('ADMIN', 'RECEPTIONIST')
  @ApiOperation({ summary: 'List all invoices' })
  async findAll(@Query() query: PaginationDto & { status?: string; patientId?: string }) {
    return this.billingService.findAll(query);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice details' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.billingService.findOne(id);
  }

  @Patch('invoices/:id/pay')
  @Roles('ADMIN', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Mark invoice as paid' })
  async markPaid(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { paymentMethod: string },
  ) {
    return this.billingService.markPaid(id, dto.paymentMethod);
  }

  @Get('summary/:patientId')
  @ApiOperation({ summary: 'Get patient billing summary' })
  async patientSummary(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.billingService.getPatientBillingSummary(patientId);
  }

  @Get('invoices/:id/pdf')
  @ApiOperation({ summary: 'Download invoice PDF' })
  async downloadPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const invoice = await this.billingService.findOne(id);
    const pdfService = new (await import('../pdf/pdf.service')).PdfService();
    const buffer = await pdfService.generateInvoicePdf(invoice.data);

    res.set({
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="invoice-${invoice.data.invoiceNumber}.html"`,
    });
    res.send(buffer);
  }
}