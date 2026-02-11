import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationService,
    private redis: RedisService,
  ) {}

  /**
   * Send appointment reminders 1 hour before
   * Runs every 15 minutes
   */
  @Cron('*/15 * * * *')
  async sendAppointmentReminders() {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const fifteenMinLater = new Date(now.getTime() + 75 * 60 * 1000);

    const upcoming = await this.prisma.appointment.findMany({
      where: {
        slotStart: { gte: oneHourLater, lt: fifteenMinLater },
        status: { in: ['CONFIRMED', 'SCHEDULED'] },
      },
      include: {
        patient: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, phone: true } },
          },
        },
        doctor: { select: { firstName: true, lastName: true } },
      },
    });

    for (const apt of upcoming) {
      const reminderKey = `reminder:sent:${apt.id}`;
      const alreadySent = await this.redis.get(reminderKey);
      if (alreadySent) continue;

      await this.notifications.send({
        userId: apt.patient.userId,
        channel: 'SMS',
        title: 'Appointment Reminder',
        body: `Reminder: Your appointment with Dr. ${apt.doctor.firstName} ${apt.doctor.lastName} is in 1 hour at ${apt.slotStart.toLocaleTimeString()}.`,
        data: { appointmentId: apt.id },
      });

      await this.redis.set(reminderKey, 'true', 7200); // 2 hour TTL
      this.logger.log(`Reminder sent for appointment ${apt.id}`);
    }
  }

  /**
   * Mark no-show appointments
   * Runs every 30 minutes
   */
  @Cron('*/30 * * * *')
  async markNoShows() {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

    const result = await this.prisma.appointment.updateMany({
      where: {
        slotEnd: { lt: thirtyMinAgo },
        status: { in: ['CONFIRMED', 'SCHEDULED'] },
      },
      data: { status: 'NO_SHOW' },
    });

    if (result.count > 0) {
      this.logger.log(`Marked ${result.count} appointments as NO_SHOW`);
    }
  }

  /**
   * Clean up expired refresh tokens
   * Runs daily at 3 AM
   */
  @Cron('0 3 * * *')
  async cleanupExpiredTokens() {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { revokedAt: { not: null } },
        ],
      },
    });

    this.logger.log(`Cleaned up ${result.count} expired/revoked tokens`);
  }

  /**
   * Generate daily summary for admin
   * Runs daily at 7 AM
   */
  @Cron('0 7 * * *')
  async dailyAdminSummary() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [appointments, revenue, newPatients, completedLabs] =
      await Promise.all([
        this.prisma.appointment.count({
          where: { slotStart: { gte: yesterday, lt: today } },
        }),
        this.prisma.invoice.aggregate({
          where: { paidAt: { gte: yesterday, lt: today }, status: 'PAID' },
          _sum: { totalCents: true },
        }),
        this.prisma.patient.count({
          where: { createdAt: { gte: yesterday, lt: today } },
        }),
        this.prisma.labReport.count({
          where: {
            completedAt: { gte: yesterday, lt: today },
            status: 'COMPLETED',
          },
        }),
      ]);

    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true },
    });

    const totalRevenue = (revenue._sum.totalCents || 0) / 100;

    for (const admin of admins) {
      await this.notifications.send({
        userId: admin.id,
        channel: 'EMAIL',
        title: `Daily Summary — ${yesterday.toLocaleDateString()}`,
        body: `Appointments: ${appointments} | Revenue: $${totalRevenue.toFixed(2)} | New Patients: ${newPatients} | Labs Completed: ${completedLabs}`,
      });
    }

    this.logger.log('Daily admin summary sent');
  }

  /**
   * Send overdue invoice reminders
   * Runs daily at 9 AM
   */
  @Cron('0 9 * * *')
  async sendOverdueReminders() {
    const overdue = await this.prisma.invoice.findMany({
      where: {
        status: 'UNPAID',
        dueDate: { lt: new Date() },
      },
      include: {
        patient: {
          include: {
            user: { select: { id: true, firstName: true } },
          },
        },
      },
    });

    for (const invoice of overdue) {
      const reminderKey = `overdue:reminder:${invoice.id}:${new Date().toISOString().split('T')[0]}`;
      const alreadySent = await this.redis.get(reminderKey);
      if (alreadySent) continue;

      await this.notifications.send({
        userId: invoice.patient.userId,
        channel: 'EMAIL',
        title: 'Overdue Invoice Reminder',
        body: `Hi ${invoice.patient.user.firstName}, your invoice ${invoice.invoiceNumber} for $${(invoice.totalCents / 100).toFixed(2)} is overdue. Please settle at your earliest convenience.`,
        data: { invoiceId: invoice.id },
      });

      await this.redis.set(reminderKey, 'true', 86400);
    }

    if (overdue.length > 0) {
      this.logger.log(`Sent ${overdue.length} overdue invoice reminders`);
    }
  }
}