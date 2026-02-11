import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DoctorService } from './doctor.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtPayload } from '../../common/guards/jwt-auth.guard';

@ApiTags('doctors')
@Controller('doctors')
export class DoctorController {
  constructor(private doctorService: DoctorService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List doctors (public)' })
  async findAll(
    @Query() query: PaginationDto & { department?: string; search?: string },
  ) {
    return this.doctorService.findAll(query);
  }

  @Public()
  @Get(':userId')
  @ApiOperation({ summary: 'Get doctor profile (public)' })
  async findOne(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.doctorService.findOne(userId);
  }

  @Post('profile')
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create doctor profile (admin)' })
  async createProfile(
    @Body() dto: {
      userId: string;
      department: string;
      specialization: string;
      licenseNumber: string;
      qualifications?: string[];
      experienceYears?: number;
      consultationFeeCents?: number;
      bio?: string;
      schedule?: Record<string, any>;
    },
  ) {
    return this.doctorService.createProfile(dto.userId, dto);
  }

  @Put('profile')
  @ApiBearerAuth()
  @Roles('DOCTOR')
  @ApiOperation({ summary: 'Update own doctor profile' })
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: any,
  ) {
    return this.doctorService.updateProfile(user.sub, dto);
  }
}