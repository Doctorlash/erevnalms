import {
  Controller,
  Get,
  Param,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { StudentDashboardService } from './student-dashboard.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role?: string;
  };
}

@Controller('student-dashboard')
export class StudentDashboardController {
  constructor(
    private readonly studentDashboardService: StudentDashboardService,
  ) {}

  @Get(':studentId')
  @UseGuards(JwtAuthGuard)
  dashboard(
    @Param('studentId') studentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.id !== studentId) {
      throw new UnauthorizedException(
        'You are not authorized to access this dashboard.',
      );
    }

    return this.studentDashboardService.getDashboard(req.user.id);
  }
}
