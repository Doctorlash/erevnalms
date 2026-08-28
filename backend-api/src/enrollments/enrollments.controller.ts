import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';

@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  enroll(@Body() dto: CreateEnrollmentDto) {
    return this.enrollmentsService.enroll(dto.userId, dto.subjectId);
  }

  @Get('student/:userId')
  getStudentEnrollments(@Param('userId') userId: string) {
    return this.enrollmentsService.getStudentEnrollments(userId);
  }

  @Get('subject/:subjectId')
  getSubjectStudents(@Param('subjectId') subjectId: string) {
    return this.enrollmentsService.getSubjectStudents(subjectId);
  }

  @Get('teacher/:teacherId')
  getTeacherStudents(
    @Param('teacherId')
    teacherId: string,
  ) {
    return this.enrollmentsService.getTeacherStudents(teacherId);
  }
}
