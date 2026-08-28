import { Controller, Get, Param } from '@nestjs/common';

import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('student/:userId')
  getStudentDashboard(
    @Param('userId')
    userId: string,
  ) {
    return this.dashboardService.getStudentDashboard(userId);
  }

  @Get('user/:userId/active')
  activeSubscription(
    @Param('userId')
    userId: string,
  ) {
    return this.dashboardService.getActiveSubscription(userId);
  }
}
