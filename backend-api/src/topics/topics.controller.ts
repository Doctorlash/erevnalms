import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { TopicsService } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';

@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Post()
  create(@Body() dto: CreateTopicDto) {
    return this.topicsService.create(dto);
  }

  @Get()
  findAll() {
    return this.topicsService.findAll();
  }

  @Get('subject/:subjectId')
  findBySubject(@Param('subjectId') subjectId: string) {
    return this.topicsService.findBySubject(subjectId);
  }
  @Get('teacher/:teacherId')
  teacherTopics(
    @Param('teacherId')
    teacherId: string,
  ) {
    return this.topicsService.teacherTopics(teacherId);
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.topicsService.findOne(id);
  }
}
