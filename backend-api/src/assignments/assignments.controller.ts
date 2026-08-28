import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { AssignmentsService } from './assignments.service';

import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
import { GradeAssignmentDto } from './dto/grade-assignment.dto';

@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly service: AssignmentsService) {}

  @Post()
  create(
    @Body()
    dto: CreateAssignmentDto,
  ) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.service.findOne(id);
  }

  @Post(':id/submit')
  submit(
    @Param('id')
    id: string,
    @Body()
    dto: SubmitAssignmentDto,
  ) {
    return this.service.submit(id, dto);
  }

  @Post('submissions/:id/grade')
  gradeSubmission(
    @Param('id')
    id: string,
    @Body()
    dto: GradeAssignmentDto,
  ) {
    return this.service.gradeSubmission(id, dto);
  }

  @Get('student/:studentId')
  studentAssignments(
    @Param('studentId')
    studentId: string,
  ) {
    return this.service.studentAssignments(studentId);
  }

  @Get('teacher/:teacherId')
  teacherAssignments(
    @Param('teacherId')
    teacherId: string,
  ) {
    return this.service.teacherAssignments(teacherId);
  }

  @Get(':id/submissions')
  getSubmissions(
    @Param('id')
    id: string,
  ) {
    return this.service.getSubmissions(id);
  }
}
