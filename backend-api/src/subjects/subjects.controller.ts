import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

import { StudentProgrammeType } from '@prisma/client';

@Controller('subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  /**
   * ============================================================
   * ADMIN
   * CREATE SUBJECT
   * ============================================================
   *
   * Example:
   *
   * {
   *   "name": "Mathematics",
   *   "description": "JAMB Mathematics",
   *   "programme": "JAMB"
   * }
   *
   * or:
   *
   * {
   *   "name": "Mathematics",
   *   "description": "WAEC Mathematics",
   *   "programme": "WAEC"
   * }
   */
  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateSubjectDto) {
    return this.subjectsService.create(dto);
  }

  /**
   * ============================================================
   * ADMIN
   * GET ALL SUBJECTS
   * ============================================================
   *
   * Optional:
   *
   * GET /subjects?programme=JAMB
   *
   * GET /subjects?programme=WAEC
   *
   * Without programme:
   *
   * GET /subjects
   */
  @Get()
  @Roles('ADMIN')
  findAll(@Query('programme') programme?: StudentProgrammeType) {
    return this.subjectsService.findAll(programme);
  }

  /**
   * ============================================================
   * STUDENT
   * GET AUTHENTICATED STUDENT'S SUBJECTS
   * ============================================================
   *
   * IMPORTANT:
   *
   * The user ID comes from the JWT.
   *
   * A student cannot provide another user's ID.
   */
  @Get('my-subjects')
  @Roles('STUDENT')
  mySubjects(@CurrentUser() user: AuthenticatedUser) {
    return this.subjectsService.studentSubjects(user.id);
  }

  /**
   * ============================================================
   * TEACHER
   * GET AUTHENTICATED TEACHER'S SUBJECTS
   * ============================================================
   */
  @Get('my-subjects/teacher')
  @Roles('TEACHER')
  teacherSubjects(@CurrentUser() user: AuthenticatedUser) {
    return this.subjectsService.teacherSubjects(user.id);
  }

  /**
   * ============================================================
   * ADMIN
   * GET SUBJECTS ASSIGNED TO A SPECIFIC TEACHER
   * ============================================================
   */
  @Get('teacher/:teacherId')
  @Roles('ADMIN')
  teacherSubjectsById(@Param('teacherId') teacherId: string) {
    return this.subjectsService.teacherSubjects(teacherId);
  }

  /**
   * ============================================================
   * STUDENT
   * GET ONE ENROLLED SUBJECT
   * ============================================================
   *
   * The student identity comes from the JWT.
   *
   * Changing the subject ID does not give access unless the
   * authenticated student is actually enrolled.
   */
  @Get('student/:id')
  @Roles('STUDENT')
  studentSubject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.subjectsService.studentSubject(user.id, id);
  }

  /**
   * ============================================================
   * ADMIN
   * GET ONE SUBJECT
   * ============================================================
   */
  @Get('available')
  @Roles('STUDENT')
  availableForStudent(@Query('programme') programme: StudentProgrammeType) {
    return this.subjectsService.availableForStudent(programme);
  }
  @Get('available-for-teacher')
  @Roles('TEACHER')
  async availableForTeacher(
    @Query('programme') programme: StudentProgrammeType,
  ) {
    return this.subjectsService.availableForTeacher(programme);
  }
  @Get(':id')
  @Roles('ADMIN')
  findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(id);
  }

  /**
   * ============================================================
   * ADMIN
   * DELETE SUBJECT
   * ============================================================
   */
  @Delete(':id')
  @Roles('ADMIN')
  delete(@Param('id') id: string) {
    return this.subjectsService.delete(id);
  }

  /**
   * ============================================================
   * ADMIN
   * ASSIGN TEACHER
   * ============================================================
   */
  @Patch(':subjectId/assign-teacher/:teacherId')
  @Roles('ADMIN')
  assignTeacher(
    @Param('subjectId') subjectId: string,
    @Param('teacherId') teacherId: string,
  ) {
    return this.subjectsService.assignTeacher(subjectId, teacherId);
  }
}
