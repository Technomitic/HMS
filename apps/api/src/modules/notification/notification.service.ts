import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

interface SendNotificationDto {
  userId: string;
  channel: 'SMS' | 'EMAIL' | 'PUSH' | 'IN_APP';
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async send(dto: SendNotificationDto) {
    // Store in DB
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        channel: dto.channel as any,
        title: dto.title,
        body: dto.body,
        data: dto.data as any,
        sentAt: new Date(),
      },
    });

    // Dispatch to channel
    try {
      switch (dto.channel) {
        case 'SMS':
          await this.sendSMS(dto);
          break;
        case 'EMAIL':
          await this.sendEmail(dto);
          break;
        case 'PUSH':
          await this.sendPush(dto);
          break;
        case 'IN_APP':
          // Already stored in DB, clients will poll or use WebSocket
          break;
      }

      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { deliveredAt: new Date() },
      });
    } catch (error) {
      this.logger.error(`Notification delivery failed (${dto.channel}):`, error);
    }

    return notification;
  }

  async getUserNotifications(userId: string, limit = 20) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  private async sendSMS(dto: SendNotificationDto) {
    const twilioSid = this.config.get('TWILIO_ACCOUNT_SID');
    if (!twilioSid) {
      this.logger.warn('Twilio not configured; SMS not sent');
      return;
    }

    // In production, use Twilio SDK:
    // const twilio = require('twilio')(twilioSid, this.config.get('TWILIO_AUTH_TOKEN'));
    // await twilio.messages.create({ body: dto.body, from: '+1...', to: userPhone });
    this.logger.log(`[SMS] To user ${dto.userId}: ${dto.title}`);
  }

  private async sendEmail(dto: SendNotificationDto) {
    const sendgridKey = this.config.get('SENDGRID_API_KEY');
    if (!sendgridKey) {
      this.logger.warn('SendGrid not configured; email not sent');
      return;
    }

    // In production, use SendGrid SDK:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(sendgridKey);
    // await sgMail.send({ to: userEmail, from: 'noreply@medix.com', subject: dto.title, html: dto.body });
    this.logger.log(`[EMAIL] To user ${dto.userId}: ${dto.title}`);
  }

  private async sendPush(dto: SendNotificationDto) {
    // In production, use Firebase Admin SDK:
    // const admin = require('firebase-admin');
    // await admin.messaging().send({ token: userFcmToken, notification: { title, body }, data });
    this.logger.log(`[PUSH] To user ${dto.userId}: ${dto.title}`);
  }
}