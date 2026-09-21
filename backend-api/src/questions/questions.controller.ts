import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Controller('questions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  /**
   * ============================================================
   * CREATE QUESTION
   * ADMIN + TEACHER
   * ============================================================
   */
  @Post()
  @Roles('ADMIN', 'TEACHER')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateQuestionDto,
  ) {
    if (!user?.id || !user?.role) {
      throw new UnauthorizedException(
        'Authenticated user information is missing.',
      );
    }

    return this.questionsService.create(dto, user.id, user.role);
  }

  /**
   * ============================================================
   * GET ALL QUESTIONS
   * ADMIN ONLY
   * ============================================================
   */
  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.questionsService.findAll();
  }

  /**
   * ============================================================
   * GET TEACHER QUESTIONS
   * ============================================================
   *
   * A teacher can only access their own question bank.
   * The authenticated user's ID is therefore the source of
   * truth, not the teacherId supplied in the URL.
   */
  @Get('teacher/:teacherId')
  @Roles('TEACHER')
  teacherQuestions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('teacherId') teacherId: string,
  ) {
    if (!user?.id) {
      throw new UnauthorizedException(
        'Authenticated user information is missing.',
      );
    }

    return this.questionsService.teacherQuestions(user.id);
  }

  /**
   * ============================================================
   * GET ONE QUESTION
   * ADMIN + TEACHER
   * ============================================================
   */
  @Get(':id')
  @Roles('ADMIN', 'TEACHER')
  findOne(@Param('id') id: string) {
    return this.questionsService.findOne(id);
  }

  /**
   * ============================================================
   * DELETE QUESTION
   * ADMIN ONLY
   * ============================================================
   */
  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.questionsService.remove(id);
  }
}
