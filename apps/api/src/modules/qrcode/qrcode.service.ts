import { Injectable, Logger } from '@nestjs/common';
import * as QRCode from 'qrcode';

@Injectable()
export class QrCodeService {
  private readonly logger = new Logger(QrCodeService.name);

  async generateQrPng(data: string, size = 300): Promise<Buffer> {
    return QRCode.toBuffer(data, {
      type: 'png',
      width: size,
      margin: 2,
      color: {
        dark: '#1E293B',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });
  }

  async generateQrDataUrl(data: string, size = 300): Promise<string> {
    return QRCode.toDataURL(data, {
      width: size,
      margin: 2,
      color: {
        dark: '#1E293B',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });
  }

  async generateQrSvg(data: string): Promise<string> {
    return QRCode.toString(data, {
      type: 'svg',
      margin: 2,
      color: {
        dark: '#1E293B',
        light: '#FFFFFF',
      },
    });
  }

  buildAppointmentQrPayload(appointmentId: string, qrHash: string): string {
    return JSON.stringify({
      type: 'medix:checkin',
      appointmentId,
      hash: qrHash,
      v: 1,
    });
  }
}