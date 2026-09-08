import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  /**
   * ============================================================
   * ADMIN
   * ENROLL STUDENT INTO SUBJECT
   * ============================================================
   *
   * Example:
   *
   * POST /enrollments
   *
   * {
   *   "userId": "student-id",
   *   "subjectId": "subject-id"
   * }
   *
   * The programme is determined by the backend from the Subject.
   */
  @Post()
  @Roles('ADMIN')
  enroll(@Body() dto: CreateEnrollmentDto) {
    return this.enrollmentsService.enroll(dto.userId, dto.subjectId);
  }

  /**
   * ============================================================
   * STUDENT
   * GET OWN ENROLLMENTS
   * ============================================================
   *
   * The user ID comes from the JWT.
   *
   * We deliberately do NOT accept a userId from the URL.
   *
   * Therefore:
   *
   * Student A cannot request:
   *
   * GET /enrollments/student/student-B-id
   *
   * to see Student B's subjects.
   */
  @Get('student')
  @Roles('STUDENT')
  getStudentEnrollments(@CurrentUser() user: AuthenticatedUser) {
    return this.enrollmentsService.getStudentEnrollments(user.id);
  }

  /**
   * ============================================================
   * ADMIN
   * GET STUDENTS IN A SUBJECT
   * ============================================================
   */
  @Get('subject/:subjectId')
  @Roles('ADMIN')
  getSubjectStudents(@Param('subjectId') subjectId: string) {
    return this.enrollmentsService.getSubjectStudents(subjectId);
  }

  /**
   * ============================================================
   * TEACHER
   * GET STUDENTS IN TEACHER'S SUBJECTS
   * ============================================================
   *
   * The authenticated teacher's ID is used.
   *
   * The URL does not determine whose students are returned.
   */
  @Get('teacher')
  @Roles('TEACHER')
  getTeacherStudents(@CurrentUser() user: AuthenticatedUser) {
    return this.enrollmentsService.getTeacherStudents(user.id);
  }

  /**
   * ============================================================
   * ADMIN
   * REMOVE STUDENT FROM SUBJECT
   * ============================================================
   */
  @Delete(':userId/:subjectId')
  @Roles('ADMIN')
  removeEnrollment(
    @Param('userId') userId: string,
    @Param('subjectId') subjectId: string,
  ) {
    return this.enrollmentsService.removeEnrollment(userId, subjectId);
  }
}
