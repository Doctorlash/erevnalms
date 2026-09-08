import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Controller('lessons')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  /**
   * ============================================================
   * TEACHER
   * CREATE LESSON
   * ============================================================
   */
  @Post()
  @Roles('TEACHER')
  create(@Body() dto: CreateLessonDto, @CurrentUser() user: AuthenticatedUser) {
    return this.lessonsService.create(dto, user.id);
  }

  /**
   * ============================================================
   * STUDENT
   * GET AVAILABLE LESSONS
   * ============================================================
   *
   * The service only returns lessons belonging to subjects
   * for which this student currently has active access.
   *
   * FREE:
   * - expiresAt must be in the future
   *
   * PAID:
   * - active enrollment is required
   */
  @Get()
  @Roles('STUDENT')
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.lessonsService.findAll(user.id);
  }

  /**
   * ============================================================
   * ADMIN
   * GET PENDING LESSONS
   * ============================================================
   */
  @Get('admin/pending')
  @Roles('ADMIN')
  adminPendingLessons() {
    return this.lessonsService.adminPendingLessons();
  }

  /**
   * ============================================================
   * TEACHER
   * GET TEACHER'S LESSONS
   * ============================================================
   */
  @Get('teacher')
  @Roles('TEACHER')
  teacherLessons(@CurrentUser() user: AuthenticatedUser) {
    return this.lessonsService.teacherLessons(user.id);
  }

  /**
   * ============================================================
   * STUDENT
   * GET LESSONS BY TOPIC
   * ============================================================
   *
   * The service verifies that the student has active access
   * to the subject before returning any lessons.
   */
  @Get('topic/:topicId')
  @Roles('STUDENT')
  findByTopic(
    @Param('topicId') topicId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lessonsService.findByTopic(topicId, user.id);
  }

  /**
   * ============================================================
   * TEACHER
   * SUBMIT LESSON FOR APPROVAL
   * ============================================================
   */
  @Patch(':id/submit')
  @Roles('TEACHER')
  submitForApproval(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lessonsService.submitForApproval(id, user.id);
  }

  /**
   * ============================================================
   * ADMIN
   * APPROVE LESSON
   * ============================================================
   */
  @Patch(':id/approve')
  @Roles('ADMIN')
  approve(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.lessonsService.approve(id, user.id);
  }

  /**
   * ============================================================
   * ADMIN
   * REJECT LESSON
   * ============================================================
   */
  @Patch(':id/reject')
  @Roles('ADMIN')
  reject(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.lessonsService.reject(id, body.reason);
  }

  /**
   * ============================================================
   * STUDENT
   * GET ONE LESSON
   * ============================================================
   *
   * The service verifies:
   * - lesson is APPROVED
   * - lesson is published
   * - student has active enrollment
   * - FREE enrollment has not expired
   */
  @Get(':id')
  @Roles('STUDENT')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.lessonsService.findOne(id, user.id);
  }

  /**
   * ============================================================
   * ADMIN
   * DELETE LESSON
   * ============================================================
   */
  @Delete(':id')
  @Roles('ADMIN')
  delete(@Param('id') id: string) {
    return this.lessonsService.delete(id);
  }
}
