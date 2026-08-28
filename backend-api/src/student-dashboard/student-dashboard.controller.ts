import { Controller, Get, Param } from '@nestjs/common';

import { StudentDashboardService } from './student-dashboard.service';

@Controller('student-dashboard')
export class StudentDashboardController {
  constructor(private readonly service: StudentDashboardService) {}

  @Get(':studentId')
  dashboard(
    @Param('studentId')
    studentId: string,
  ) {
    return this.service.getDashboard(studentId);
  }
}
