import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { ProgressService } from './progress.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  /**
   * STUDENT
   *
   * Mark a lesson as completed.
   *
   * IMPORTANT:
   * The user ID is taken from the authenticated JWT.
   * The client does NOT provide a userId.
   */
  @Post('complete')
  completeLesson(
    @Body()
    body: {
      lessonId: string;
    },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.progressService.markComplete(user.id, body.lessonId);
  }

  /**
   * AUTHENTICATED USER
   *
   * Get the current student's lesson progress.
   *
   * The userId comes from the JWT rather than the URL.
   */
  @Get('student')
  getMyProgress(@CurrentUser() user: AuthenticatedUser) {
    return this.progressService.getStudentProgress(user.id);
  }

  /**
   * AUTHENTICATED USER
   *
   * Get the current student's progress statistics.
   */
  @Get('student/stats')
  getMyStats(@CurrentUser() user: AuthenticatedUser) {
    return this.progressService.getStats(user.id);
  }

  /**
   * ADMIN / FUTURE USE
   *
   * Get progress for a specific student.
   *
   * Keep this endpoint only if you need administrators
   * to inspect another student's progress.
   *
   * We will add an ADMIN role restriction later if required.
   */
  @Get('student/:userId')
  getProgress(@Param('userId') userId: string) {
    return this.progressService.getStudentProgress(userId);
  }

  /**
   * ADMIN / FUTURE USE
   *
   * Get statistics for a specific student.
   */
  @Get('student/:userId/stats')
  getStats(@Param('userId') userId: string) {
    return this.progressService.getStats(userId);
  }
}
