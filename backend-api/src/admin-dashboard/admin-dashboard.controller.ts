import { Controller, Get, UseGuards } from '@nestjs/common';

import { AdminDashboardService } from './admin-dashboard.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin-dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminDashboardController {
  constructor(private readonly service: AdminDashboardService) {}

  @Get()
  @Roles('ADMIN')
  dashboard() {
    return this.service.dashboard();
  }
}
