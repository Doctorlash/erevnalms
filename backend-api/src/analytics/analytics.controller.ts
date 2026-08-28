import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import { AnalyticsService } from './analytics.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { Role } from '@prisma/client';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('student/:userId')
  studentOverview(@Param('userId') userId: string) {
    return this.analyticsService.studentOverview(userId);
  }

  @Get('leaderboard')
  leaderboard() {
    return this.analyticsService.leaderboard();
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  adminOverview() {
    return this.analyticsService.adminOverview();
  }
}
