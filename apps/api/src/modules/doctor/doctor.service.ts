import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { PaginationDto, paginate, buildPaginationMeta } from '../../common/dto/pagination.dto';

@Injectable()
export class DoctorService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll(query: PaginationDto & { department?: string; search?: string }) {
    const { page = 1, limit = 20, department, search } = query;

    const where: any = { user: { role: 'DOCTOR', isActive: true } };
    if (department) where.department = department;
    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { specialization: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [doctors, total] = await Promise.all([
      this.prisma.doctorProfile.findMany({
        where,
        ...paginate(page, limit),
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { experienceYears: 'desc' },
      }),
      this.prisma.doctorProfile.count({ where }),
    ]);

    return { data: doctors, meta: buildPaginationMeta(page, limit, total) };
  }

  async findOne(userId: string) {
    const cached = await this.redis.getJson(`doctor:${userId}`);
    if (cached) return { data: cached };

    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!profile) throw new NotFoundException('Doctor not found');

    await this.redis.setJson(`doctor:${userId}`, profile, 600);
    return { data: profile };
  }

  async createProfile(userId: string, dto: any) {
    const profile = await this.prisma.doctorProfile.create({
      data: {
        userId,
        department: dto.department,
        specialization: dto.specialization,
        licenseNumber: dto.licenseNumber,
        qualifications: dto.qualifications || [],
        experienceYears: dto.experienceYears || 0,
        consultationFee: dto.consultationFeeCents || 0,
        bio: dto.bio,
        schedule: dto.schedule || {},
      },
    });
    return { data: profile };
  }

  async updateProfile(userId: string, dto: any) {
    const profile = await this.prisma.doctorProfile.update({
      where: { userId },
      data: dto,
    });

    await this.redis.del(`doctor:${userId}`);
    return { data: profile };
  }
}