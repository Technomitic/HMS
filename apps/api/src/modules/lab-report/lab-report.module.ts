import { Module } from '@nestjs/common';
import { LabReportController } from './lab-report.controller';
import { LabReportService } from './lab-report.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [LabReportController],
  providers: [LabReportService],
  exports: [LabReportService],
})
export class LabReportModule {}