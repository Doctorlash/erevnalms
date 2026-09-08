import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { StudentProgrammeType, TeacherApplicationStatus } from '@prisma/client';

import { TeacherApplicationsService } from './teacher-applications.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

import { UseGuards } from '@nestjs/common';

@Controller('teacher-applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeacherApplicationsController {
  constructor(
    private readonly teacherApplicationsService: TeacherApplicationsService,
  ) {}

  /**
   * ============================================================
   * TEACHER
   * APPLY FOR SUBJECT
   * ============================================================
   */
  @Post()
  @Roles('TEACHER')
  apply(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      subjectId: string;
      programme: StudentProgrammeType;
    },
  ) {
    return this.teacherApplicationsService.apply(
      user.id,
      body.subjectId,
      body.programme,
    );
  }

  /**
   * ============================================================
   * TEACHER
   * MY APPLICATIONS
   * ============================================================
   */
  @Get('my-applications')
  @Roles('TEACHER')
  myApplications(@CurrentUser() user: AuthenticatedUser) {
    return this.teacherApplicationsService.myApplications(user.id);
  }

  /**
   * ============================================================
   * ADMIN
   * ALL APPLICATIONS
   * ============================================================
   */
  @Get('admin/all')
  @Roles('ADMIN')
  adminAll(@Query('status') status?: TeacherApplicationStatus) {
    return this.teacherApplicationsService.adminAll(status);
  }

  /**
   * ============================================================
   * ADMIN
   * ONE APPLICATION
   * ============================================================
   */
  @Get('admin/:id')
  @Roles('ADMIN')
  adminOne(@Param('id') id: string) {
    return this.teacherApplicationsService.adminOne(id);
  }

  /**
   * ============================================================
   * ADMIN
   * APPROVE
   * ============================================================
   */
  @Patch('admin/:id/approve')
  @Roles('ADMIN')
  approve(@Param('id') id: string) {
    return this.teacherApplicationsService.approve(id);
  }

  /**
   * ============================================================
   * ADMIN
   * REJECT
   * ============================================================
   */
  @Patch('admin/:id/reject')
  @Roles('ADMIN')
  reject(@Param('id') id: string, @Body() body: { rejectionReason: string }) {
    return this.teacherApplicationsService.reject(id, body.rejectionReason);
  }
}
