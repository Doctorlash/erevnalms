import { Controller, Get, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

@Controller('test')
export class TestController {
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminRoute() {
    return {
      message: 'Admin Access Granted',
    };
  }

  @Get('teacher')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  teacherRoute() {
    return {
      message: 'Teacher Access Granted',
    };
  }

  @Get('student')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  studentRoute() {
    return {
      message: 'Student Access Granted',
    };
  }
}
