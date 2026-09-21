/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AnalyticsService } from './analytics.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { Role } from '@prisma/client';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('student/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT, Role.ADMIN)
  studentOverview(@Param('userId') userId: string, @Req() req: any) {
    if (req.user?.role === Role.STUDENT && req.user?.id !== userId) {
      throw new ForbiddenException(
        "You are not allowed to view another student's analytics.",
      );
    }

    return this.analyticsService.studentOverview(userId);
  }

  @Get('leaderboard')
  @UseGuards(JwtAuthGuard)
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
