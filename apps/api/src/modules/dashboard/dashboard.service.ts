import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getAdminStats() {
    const cacheKey = 'dashboard:admin';
    const cached = await this.redis.getJson(cacheKey);
    if (cached) return { data: cached };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      todayAppointments,
      totalPatients,
      todayRevenue,
      pendingLabReports,
      activeIPD,
      appointmentsByDept,
      recentActivity,
      weeklyRevenue,
    ] = await Promise.all([
      this.prisma.appointment.count({
        where: { slotStart: { gte: today, lt: tomorrow } },
      }),
      this.prisma.patient.count(),
      this.prisma.invoice.aggregate({
        where: { paidAt: { gte: today, lt: tomorrow }, status: 'PAID' },
        _sum: { totalCents: true },
      }),
      this.prisma.labReport.count({
        where: { status: { in: ['ORDERED', 'SAMPLE_COLLECTED', 'PROCESSING'] } },
      }),
      this.prisma.appointment.count({
        where: { type: 'IPD', status: { in: ['CONFIRMED', 'IN_PROGRESS'] } },
      }),
      this.prisma.appointment.groupBy({
        by: ['department'],
        where: { slotStart: { gte: today, lt: tomorrow } },
        _count: true,
      }),
      this.prisma.auditLog.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true } } },
      }),
      this.getWeeklyRevenue(),
    ]);

    const deptMap: Record<string, number> = {};
    appointmentsByDept.forEach((d) => {
      deptMap[d.department] = d._count;
    });

    const stats = {
      todayAppointments,
      totalPatients,
      todayRevenueCents: todayRevenue._sum.totalCents || 0,
      pendingLabReports,
      activeIPD,
      occupancyRate: Math.round((activeIPD / 50) * 100),
      appointmentsByDepartment: deptMap,
      revenueByDay: weeklyRevenue,
      recentActivity: recentActivity.map((log) => ({
        id: String(log.id),
        message: `${log.user.firstName} ${log.user.lastName} - ${log.action}`,
        type: this.categorizeAction(log.action),
        timestamp: log.createdAt.toISOString(),
        userId: log.userId,
        userName: `${log.user.firstName} ${log.user.lastName}`,
      })),
    };

    await this.redis.setJson(cacheKey, stats, 60);
    return { data: stats };
  }

  async getDoctorStats(doctorId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      todayAppointments,
      completedToday,
      pendingReviews,
      totalPatientsThisWeek,
      upcomingAppointments,
    ] = await Promise.all([
      this.prisma.appointment.count({
        where: {
          doctorId,
          slotStart: { gte: today, lt: tomorrow },
          status: { notIn: ['CANCELLED'] },
        },
      }),
      this.prisma.appointment.count({
        where: {
          doctorId,
          slotStart: { gte: today, lt: tomorrow },
          status: 'COMPLETED',
        },
      }),
      this.prisma.labReport.count({
        where: { orderedBy: doctorId, status: 'COMPLETED' },
      }),
      this.prisma.appointment.count({
        where: {
          doctorId,
          slotStart: { gte: weekAgo },
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        },
      }),
      this.prisma.appointment.findMany({
        where: {
          doctorId,
          slotStart: { gte: new Date() },
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        },
        take: 10,
        orderBy: { slotStart: 'asc' },
        include: {
          patient: {
            include: {
              user: {
                select: { firstName: true, lastName: true, avatarUrl: true },
              },
            },
          },
        },
      }),
    ]);

    return {
      data: {
        todayAppointments,
        completedToday,
        pendingReviews,
        totalPatientsThisWeek,
        upcomingAppointments,
      },
    };
  }

  async getPatientStats(patientUserId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId: patientUserId },
    });

    if (!patient) {
      return {
        data: {
          upcomingAppointments: [],
          recentLabReports: [],
          pendingInvoices: [],
          nextAppointment: null,
        },
      };
    }

    const [upcomingAppointments, recentLabReports, pendingInvoices] =
      await Promise.all([
        this.prisma.appointment.findMany({
          where: {
            patientId: patient.id,
            slotStart: { gte: new Date() },
            status: { in: ['SCHEDULED', 'CONFIRMED'] },
          },
          take: 5,
          orderBy: { slotStart: 'asc' },
          include: {
            doctor: {
              select: { firstName: true, lastName: true, avatarUrl: true },
            },
          },
        }),
        this.prisma.labReport.findMany({
          where: { patientId: patient.id },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            orderedByUser: { select: { firstName: true, lastName: true } },
          },
        }),
        this.prisma.invoice.findMany({
          where: { patientId: patient.id, status: 'UNPAID' },
          take: 5,
          orderBy: { dueDate: 'asc' },
        }),
      ]);

    return {
      data: {
        upcomingAppointments,
        recentLabReports,
        pendingInvoices,
        nextAppointment: upcomingAppointments[0] || null,
      },
    };
  }

  private async getWeeklyRevenue() {
    const days: { date: string; amountCents: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const result = await this.prisma.invoice.aggregate({
        where: {
          paidAt: { gte: date, lt: nextDay },
          status: 'PAID',
        },
        _sum: { totalCents: true },
      });

      days.push({
        date: date.toISOString().split('T')[0],
        amountCents: result._sum.totalCents || 0,
      });
    }
    return days;
  }

  private categorizeAction(action: string): string {
    if (action.includes('appointment')) return 'appointment';
    if (action.includes('lab')) return 'lab';
    if (action.includes('billing') || action.includes('invoice')) return 'billing';
    if (action.includes('discharge')) return 'discharge';
    return 'registration';
  }
}