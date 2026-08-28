import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { ExamAttemptsService } from './exam-attempts.service';

@Controller('exam-attempts')
export class ExamAttemptsController {
  constructor(private readonly service: ExamAttemptsService) {}

  @Post('start')
  startExam(
    @Body()
    body: {
      examId: string;
      userId: string;
    },
  ) {
    return this.service.startExam(body.examId, body.userId);
  }

  @Post('answer')
  submitAnswer(
    @Body()
    body: {
      attemptId: string;
      questionId: string;
      selectedAnswer: string;
    },
  ) {
    return this.service.submitAnswer(
      body.attemptId,
      body.questionId,
      body.selectedAnswer,
    );
  }

  @Post(':attemptId/finish')
  finishExam(
    @Param('attemptId')
    attemptId: string,
  ) {
    return this.service.finishExam(attemptId);
  }

  @Get(':attemptId/result')
  getResult(
    @Param('attemptId')
    attemptId: string,
  ) {
    return this.service.getResult(attemptId);
  }

  @Get('user/:userId')
  getUserAttempts(
    @Param('userId')
    userId: string,
  ) {
    return this.service.getUserAttempts(userId);
  }

  @Get()
  findAllAttempts() {
    return this.service.findAllAttempts();
  }

  @Get('exam/:examId')
  getAttemptsByExam(
    @Param('examId')
    examId: string,
  ) {
    return this.service.getAttemptsByExam(examId);
  }

  @Get('teacher/:teacherId')
  getTeacherAnalytics(
    @Param('teacherId')
    teacherId: string,
  ) {
    return this.service.getTeacherAnalytics(teacherId);
  }
}
