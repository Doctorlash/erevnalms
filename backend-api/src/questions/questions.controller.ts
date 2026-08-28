import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';

import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  create(
    @Body()
    dto: CreateQuestionDto,
  ) {
    return this.questionsService.create(dto);
  }

  @Get()
  findAll() {
    return this.questionsService.findAll();
  }

  @Get('teacher/:teacherId')
  teacherQuestions(
    @Param('teacherId')
    teacherId: string,
  ) {
    return this.questionsService.teacherQuestions(teacherId);
  }

  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.questionsService.findOne(id);
  }

  @Delete(':id')
  remove(
    @Param('id')
    id: string,
  ) {
    return this.questionsService.remove(id);
  }
}
