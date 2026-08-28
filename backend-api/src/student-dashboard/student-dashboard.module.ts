import { Module } from '@nestjs/common';
import { StudentDashboardController } from './student-dashboard.controller';
import { StudentDashboardService } from './student-dashboard.service';

@Module({
  controllers: [StudentDashboardController],
  providers: [StudentDashboardService]
})
export class StudentDashboardModule {}
