/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentDashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(studentId: string) {
    const enrollments = await this.prisma.enrollment.count({
      where: {
        userId: studentId,
      },
    });

    const completedLessons = await this.prisma.lessonProgress.count({
      where: {
        userId: studentId,
        completed: true,
      },
    });

    const assignments = await this.prisma.assignmentSubmission.findMany({
      where: {
        studentId,
      },
      include: {
        assignment: true,
      },
      orderBy: {
        submittedAt: 'desc',
      },
      take: 5,
    });

    const notifications = await this.prisma.notification.findMany({
      where: {
        userId: studentId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    const examAttempts = await this.prisma.examAttempt.findMany({
      where: {
        userId: studentId,
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: 5,
    });

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId: studentId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const upcomingClasses = await this.prisma.liveClass.findMany({
      where: {
        startTime: {
          gte: new Date(),
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      take: 5,
    });

    return {
      stats: {
        enrollments,
        completedLessons,
      },

      assignments,

      notifications,

      examAttempts,

      subscription,

      upcomingClasses,
    };
  }
}
