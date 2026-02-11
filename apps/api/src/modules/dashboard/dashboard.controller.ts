import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard, JwtPayload } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('admin')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get admin dashboard stats' })
  async adminStats() {
    return this.dashboardService.getAdminStats();
  }

  @Get('doctor')
  @Roles('DOCTOR')
  @ApiOperation({ summary: 'Get doctor dashboard stats' })
  async doctorStats(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getDoctorStats(user.sub);
  }

  @Get('patient')
  @ApiOperation({ summary: 'Get patient dashboard stats' })
  async patientStats(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getPatientStats(user.sub);
  }
}