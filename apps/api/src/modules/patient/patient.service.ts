import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';
import { PaginationDto, paginate, buildPaginationMeta } from '../../common/dto/pagination.dto';

@Injectable()
export class PatientService {
  private readonly logger = new Logger(PatientService.name);
  private mrnCounter = 0;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async create(userId: string, dto: CreatePatientDto) {
    const existing = await this.prisma.patient.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new ConflictException('Patient record already exists for this user');
    }

    const mrn = await this.generateMRN();

    const patient = await this.prisma.patient.create({
      data: {
        userId,
        mrn,
        dateOfBirth: new Date(dto.dateOfBirth),
        gender: dto.gender,
        bloodGroup: dto.bloodGroup,
        allergies: dto.allergies || [],
        emergencyName: dto.emergencyName,
        emergencyPhone: dto.emergencyPhone,
        emergencyRelation: dto.emergencyRelation,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        city: dto.city,
        state: dto.state,
        zipCode: dto.zipCode,
        country: dto.country || 'US',
        insuranceProvider: dto.insuranceProvider,
        insurancePolicyNo: dto.insurancePolicyNo,
        consentSigned: dto.consentSigned || false,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    this.logger.log(`Patient created: ${mrn}`);
    return { data: patient };
  }

async findAll(query: {
  page?: string | number;
  limit?: string | number;
  search?: string;
}) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;

  const where = query.search
    ? {
        OR: [
          { user: { firstName: { contains: query.search, mode: 'insensitive' as const } } },
          { user: { lastName: { contains: query.search, mode: 'insensitive' as const } } },
          { user: { email: { contains: query.search, mode: 'insensitive' as const } } },
          { medicalRecordNumber: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [patients, total] = await Promise.all([
    this.prisma.patient.findMany({
      where,
      skip,
      take: limit,  // Now it's a number, not a string
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    this.prisma.patient.count({ where }),
  ]);

  return {
    data: patients,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

  async findOne(id: string) {
    const cached = await this.redis.getJson(`patient:${id}`);
    if (cached) return { data: cached };

    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
          },
        },
        appointments: {
          take: 5,
          orderBy: { slotStart: 'desc' },
        },
        labReports: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!patient) throw new NotFoundException('Patient not found');

    await this.redis.setJson(`patient:${id}`, patient, 300);
    return { data: patient };
  }

  async findByUserId(userId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!patient) throw new NotFoundException('Patient profile not found');
    return { data: patient };
  }

  async update(id: string, dto: UpdatePatientDto) {
    const patient = await this.prisma.patient.update({
      where: { id },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    await this.redis.del(`patient:${id}`);
    return { data: patient };
  }

  private async generateMRN(): Promise<string> {
    const year = new Date().getFullYear();
    const counter = await this.redis.increment(`mrn:counter:${year}`);
    return `MRN${year}${String(counter).padStart(5, '0')}`;
  }
}