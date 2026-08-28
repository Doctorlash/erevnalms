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
   * TEACHER
   *
   * Create a new lesson.
   *
   * The lesson is created as DRAFT.
   * The authenticated teacher becomes the creator.
   */
  @Post()
  @Roles('TEACHER')
  create(@Body() dto: CreateLessonDto, @CurrentUser() user: AuthenticatedUser) {
    return this.lessonsService.create(dto, user.id);
  }

  /**
   * AUTHENTICATED USERS
   *
   * Get lessons available to students.
   *
   * The service only returns lessons that are:
   * - APPROVED
   * - Published
   */
  @Get()
  findAll() {
    return this.lessonsService.findAll();
  }

  /**
   * ADMIN
   *
   * Get lessons currently waiting for approval.
   *
   * This endpoint is used by the Admin Lesson
   * Management / Approval page.
   */
  @Get('admin/pending')
  @Roles('ADMIN')
  adminPendingLessons() {
    return this.lessonsService.adminPendingLessons();
  }

  /**
   * TEACHER
   *
   * Get all lessons belonging to the authenticated
   * teacher's assigned subjects.
   *
   * Includes:
   * - DRAFT
   * - PENDING_APPROVAL
   * - APPROVED
   * - REJECTED
   */
  @Get('teacher')
  @Roles('TEACHER')
  teacherLessons(@CurrentUser() user: AuthenticatedUser) {
    return this.lessonsService.teacherLessons(user.id);
  }

  /**
   * AUTHENTICATED USERS
   *
   * Get published lessons belonging to a topic.
   */
  @Get('topic/:topicId')
  findByTopic(@Param('topicId') topicId: string) {
    return this.lessonsService.findByTopic(topicId);
  }

  /**
   * TEACHER
   *
   * Submit a DRAFT or REJECTED lesson
   * for administrator approval.
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
   * ADMIN
   *
   * Approve a lesson.
   *
   * The service changes:
   * - status -> APPROVED
   * - isPublished -> true
   * - approvedAt -> current date/time
   * - approvedById -> authenticated admin
   */
  @Patch(':id/approve')
  @Roles('ADMIN')
  approve(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.lessonsService.approve(id, user.id);
  }

  /**
   * ADMIN
   *
   * Reject a lesson.
   *
   * Expected request body:
   *
   * {
   *   "reason": "Please improve the explanation..."
   * }
   */
  @Patch(':id/reject')
  @Roles('ADMIN')
  reject(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.lessonsService.reject(id, body.reason);
  }

  /**
   * AUTHENTICATED USERS
   *
   * Get one approved and published lesson.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lessonsService.findOne(id);
  }

  /**
   * ADMIN
   *
   * Permanently delete a lesson.
   */
  @Delete(':id')
  @Roles('ADMIN')
  delete(@Param('id') id: string) {
    return this.lessonsService.delete(id);
  }
}
