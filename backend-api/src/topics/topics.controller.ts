/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { TopicsService } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Controller('topics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  /**
   * ADMIN ONLY
   * Create a topic.
   */
  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateTopicDto) {
    return this.topicsService.create(dto);
  }

  /**
   * ADMIN ONLY
   * Get all topics.
   */
  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.topicsService.findAll();
  }

  /**
   * STUDENT ONLY
   * Get topics for a subject only if enrolled.
   */
  @Get('student/subject/:subjectId')
  @Roles('STUDENT')
  findBySubjectForStudent(
    @Req() req: any,
    @Param('subjectId') subjectId: string,
  ) {
    return this.topicsService.findBySubjectForStudent(req.user.id, subjectId);
  }

  /**
   * ADMIN ONLY
   * Get topics belonging to a subject.
   */
  @Get('subject/:subjectId')
  @Roles('ADMIN')
  findBySubject(@Param('subjectId') subjectId: string) {
    return this.topicsService.findBySubject(subjectId);
  }

  /**
   * TEACHER ONLY
   * Get topics for the authenticated teacher's assigned subjects.
   *
   * IMPORTANT:
   * The teacher ID is taken from the authenticated JWT user.
   * A teacher cannot request another teacher's topics by
   * manipulating a URL parameter.
   */
  @Get('teacher')
  @Roles('TEACHER')
  teacherTopics(@CurrentUser() user: AuthenticatedUser) {
    return this.topicsService.teacherTopics(user.id);
  }

  /**
   * STUDENT ONLY
   * Get one topic only if enrolled in its subject.
   */
  @Get('student/:id')
  @Roles('STUDENT')
  findOneForStudent(@Req() req: any, @Param('id') id: string) {
    return this.topicsService.findOneForStudent(req.user.id, id);
  }

  /**
   * ADMIN ONLY
   * Get one topic.
   */
  @Get(':id')
  @Roles('ADMIN')
  findOne(@Param('id') id: string) {
    return this.topicsService.findOne(id);
  }
}
