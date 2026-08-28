/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStudentDashboard(userId: string) {
    const enrollments = await this.prisma.enrollment.count({
      where: { userId },
    });

    const completedLessons = await this.prisma.lessonProgress.count({
      where: {
        userId,
        completed: true,
      },
    });

    const progress = await this.prisma.lessonProgress.findMany({
      where: { userId },
    });

    const averageProgress =
      progress.length > 0
        ? progress.reduce((sum, p) => sum + p.progress, 0) / progress.length
        : 0;

    return {
      enrolledSubjects: enrollments,
      completedLessons,
      averageProgress: Math.round(averageProgress),
    };
  }
  async getActiveSubscription(userId: string) {
    return this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
