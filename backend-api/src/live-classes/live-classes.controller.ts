import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { LiveClassesService } from './live-classes.service';

import { CreateLiveClassDto } from './dto/create-live-class.dto';
import { JoinClassDto } from './dto/join-class.dto';

@Controller('live-classes')
export class LiveClassesController {
  constructor(private readonly service: LiveClassesService) {}

  @Post()
  create(
    @Body()
    dto: CreateLiveClassDto,
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

  @Post(':id/join')
  joinClass(
    @Param('id')
    id: string,

    @Body()
    dto: JoinClassDto,
  ) {
    return this.service.joinClass(id, dto.studentId);
  }

  @Get(':id/attendance')
  attendance(
    @Param('id')
    id: string,
  ) {
    return this.service.attendance(id);
  }

  @Get('teacher/:teacherId')
  teacherClasses(
    @Param('teacherId')
    teacherId: string,
  ) {
    return this.service.teacherClasses(teacherId);
  }

  @Get('student/:studentId')
  studentClasses(
    @Param('studentId')
    studentId: string,
  ) {
    return this.service.studentClasses(studentId);
  }

  @Get('teacher/:teacherId/stats')
  teacherStats(
    @Param('teacherId')
    teacherId: string,
  ) {
    return this.service.teacherStats(teacherId);
  }
}
