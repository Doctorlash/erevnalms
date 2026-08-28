import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  /**
   * STUDENT
   *
   * Mark a lesson as completed.
   */
  async markComplete(userId: string, lessonId: string) {
    // Make sure the lesson actually exists.
    const lesson = await this.prisma.lesson.findUnique({
      where: {
        id: lessonId,
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Students should only be able to complete
    // lessons that are actually available to them.
    if (lesson.status !== 'APPROVED' || !lesson.isPublished) {
      throw new BadRequestException('This lesson is not currently available');
    }

    return this.prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },

      update: {
        completed: true,
        progress: 100,
        lastViewed: new Date(),
      },

      create: {
        userId,
        lessonId,
        completed: true,
        progress: 100,
        lastViewed: new Date(),
      },

      include: {
        lesson: {
          include: {
            topic: {
              include: {
                subject: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * STUDENT
   *
   * Get all lesson progress belonging to a student.
   */
  async getStudentProgress(userId: string) {
    return this.prisma.lessonProgress.findMany({
      where: {
        userId,
      },

      include: {
        lesson: {
          include: {
            topic: {
              include: {
                subject: true,
              },
            },
          },
        },
      },

      orderBy: {
        lastViewed: 'desc',
      },
    });
  }

  /**
   * STUDENT
   *
   * Get progress statistics.
   */
  async getStats(userId: string) {
    const progress = await this.prisma.lessonProgress.findMany({
      where: {
        userId,
      },
    });

    const completedLessons = progress.filter((item) => item.completed).length;

    const averageProgress =
      progress.length > 0
        ? Math.round(
            progress.reduce((sum, item) => sum + item.progress, 0) /
              progress.length,
          )
        : 0;

    return {
      completedLessons,
      averageProgress,
      totalLessonsTracked: progress.length,
    };
  }
}
