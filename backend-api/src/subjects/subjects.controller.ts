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
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  /**
   * ============================================================
   * PUBLIC REGISTRATION
   * GET SUBJECTS AVAILABLE FOR STUDENT REGISTRATION
   * ============================================================
   *
   * These subjects are loaded before the student is logged in.
   *
   * Examples:
   *
   * GET /subjects/registration?programme=JAMB
   * GET /subjects/registration?programme=WAEC
   *
   * Only active subjects belonging to the selected programme
   * are returned.
   */
  @Get('registration')
  availableForRegistration(
    @Query('programme') programme: StudentProgrammeType,
  ) {
    return this.subjectsService.availableForRegistration(programme);
  }

  /**
   * ============================================================
   * ADMIN
   * CREATE SUBJECT
   * ============================================================
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
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
   * GET /subjects?programme=WAEC
   * GET /subjects
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findAll(@Query('programme') programme?: StudentProgrammeType) {
    return this.subjectsService.findAll(programme);
  }

  /**
   * ============================================================
   * STUDENT
   * GET AUTHENTICATED STUDENT'S SUBJECTS
   * ============================================================
   */
  @Get('my-subjects')
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  teacherSubjectsById(@Param('teacherId') teacherId: string) {
    return this.subjectsService.teacherSubjects(teacherId);
  }

  /**
   * ============================================================
   * STUDENT
   * GET ONE ENROLLED SUBJECT
   * ============================================================
   */
  @Get('student/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  studentSubject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.subjectsService.studentSubject(user.id, id);
  }

  /**
   * ============================================================
   * STUDENT
   * GET AVAILABLE SUBJECTS
   * ============================================================
   */
  @Get('available')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  availableForStudent(@Query('programme') programme: StudentProgrammeType) {
    return this.subjectsService.availableForStudent(programme);
  }

  /**
   * ============================================================
   * TEACHER
   * GET AVAILABLE SUBJECTS FOR APPLICATION
   * ============================================================
   */
  @Get('available-for-teacher')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  availableForTeacher(@Query('programme') programme: StudentProgrammeType) {
    return this.subjectsService.availableForTeacher(programme);
  }

  /**
   * ============================================================
   * ADMIN
   * GET ONE SUBJECT
   * ============================================================
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  assignTeacher(
    @Param('subjectId') subjectId: string,
    @Param('teacherId') teacherId: string,
  ) {
    return this.subjectsService.assignTeacher(subjectId, teacherId);
  }
}
