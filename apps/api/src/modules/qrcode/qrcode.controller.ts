import {
  Controller,
  Get,
  Param,
  Res,
  ParseUUIDPipe,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { QrCodeService } from './qrcode.service';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('qrcodes')
@ApiBearerAuth()
@Controller('qrcodes')
export class QrCodeController {
  constructor(
    private qrService: QrCodeService,
    private prisma: PrismaService,
  ) {}

  @Get('appointment/:id')
  @ApiOperation({ summary: 'Get QR code PNG for appointment check-in' })
  async getAppointmentQr(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      select: { id: true, qrCodeHash: true, status: true },
    });

    if (!appointment || !appointment.qrCodeHash) {
      throw new NotFoundException('Appointment or QR code not found');
    }

    const payload = this.qrService.buildAppointmentQrPayload(
      appointment.id,
      appointment.qrCodeHash,
    );

    const buffer = await this.qrService.generateQrPng(payload);

    res.set({
      'Content-Type': 'image/png',
      'Content-Length': buffer.length,
      'Cache-Control': 'public, max-age=3600',
    });
    res.send(buffer);
  }

  @Get('appointment/:id/svg')
  @ApiOperation({ summary: 'Get QR code SVG for appointment' })
  async getAppointmentQrSvg(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      select: { id: true, qrCodeHash: true },
    });

    if (!appointment || !appointment.qrCodeHash) {
      throw new NotFoundException('Appointment or QR code not found');
    }

    const payload = this.qrService.buildAppointmentQrPayload(
      appointment.id,
      appointment.qrCodeHash,
    );

    const svg = await this.qrService.generateQrSvg(payload);

    res.set({ 'Content-Type': 'image/svg+xml' });
    res.send(svg);
  }
}