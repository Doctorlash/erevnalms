import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { ExamsService } from './exams.service';

import { CreateExamDto } from './dto/create-exam.dto';
import { AddQuestionDto } from './dto/add-question.dto';

@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post()
  create(
    @Body()
    dto: CreateExamDto,
  ) {
    return this.examsService.create(dto);
  }

  @Get()
  findAll() {
    return this.examsService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.examsService.findOne(id);
  }

  @Post(':id/questions')
  addQuestion(
    @Param('id')
    examId: string,

    @Body()
    dto: AddQuestionDto,
  ) {
    return this.examsService.addQuestion(examId, dto.questionId);
  }
}
