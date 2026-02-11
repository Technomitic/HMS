import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}