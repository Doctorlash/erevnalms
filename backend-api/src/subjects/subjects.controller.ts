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

import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  /**
   * ADMIN ONLY
   * Create a subject
   */
  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateSubjectDto) {
    return this.subjectsService.create(dto);
  }

  /**
   * AUTHENTICATED USERS
   * Get all subjects
   */
  @Get()
  findAll() {
    return this.subjectsService.findAll();
  }

  /**
   * TEACHER ONLY
   * Get subjects assigned to a teacher
   */
  @Get('teacher/:teacherId')
  @Roles('TEACHER')
  teacherSubjects(
    @Param('teacherId')
    teacherId: string,
  ) {
    return this.subjectsService.teacherSubjects(teacherId);
  }

  /**
   * AUTHENTICATED USERS
   * Get one subject
   */
  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.subjectsService.findOne(id);
  }

  /**
   * ADMIN ONLY
   * Delete a subject
   */
  @Delete(':id')
  @Roles('ADMIN')
  delete(
    @Param('id')
    id: string,
  ) {
    return this.subjectsService.delete(id);
  }

  /**
   * ADMIN ONLY
   * Assign teacher to subject
   */
  @Patch(':subjectId/assign-teacher/:teacherId')
  @Roles('ADMIN')
  assignTeacher(
    @Param('subjectId')
    subjectId: string,

    @Param('teacherId')
    teacherId: string,
  ) {
    return this.subjectsService.assignTeacher(subjectId, teacherId);
  }
}
