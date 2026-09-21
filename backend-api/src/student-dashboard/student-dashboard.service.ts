import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentDashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(studentId: string) {
    const now = new Date();

    // =========================================================
    // ACTIVE ENROLLMENTS
    // =========================================================

    const enrollments = await this.prisma.enrollment.count({
      where: {
        userId: studentId,
        subject: {
          isActive: true,
        },
        OR: [
          {
            type: 'FREE',
            expiresAt: {
              gt: now,
            },
          },
          {
            type: 'PAID',
            expiresAt: {
              gt: now,
            },
            studentCohort: {
              status: 'ACTIVE',
              cohort: {
                status: {
                  not: 'CANCELLED',
                },
                startDate: {
                  lte: now,
                },
                endDate: {
                  gt: now,
                },
              },
            },
          },
        ],
      },
    });

    // =========================================================
    // COMPLETED LESSONS
    // =========================================================

    const completedLessons = await this.prisma.lessonProgress.count({
      where: {
        userId: studentId,
        completed: true,
      },
    });

    // =========================================================
    // RECENT ASSIGNMENT SUBMISSIONS
    // =========================================================

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

    // =========================================================
    // RECENT NOTIFICATIONS
    // =========================================================

    const notifications = await this.prisma.notification.findMany({
      where: {
        userId: studentId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    // =========================================================
    // RECENT EXAM ATTEMPTS
    // =========================================================

    const examAttempts = await this.prisma.examAttempt.findMany({
      where: {
        userId: studentId,
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: 5,
    });

    // =========================================================
    // MOST RECENT SUBSCRIPTION
    // =========================================================

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId: studentId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        cohort: true,
        studentCohort: {
          include: {
            cohort: true,
          },
        },
      },
    });

    // =========================================================
    // UPCOMING LIVE CLASSES
    // =========================================================

    const upcomingClasses = await this.prisma.liveClass.findMany({
      where: {
        startTime: {
          gte: now,
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      take: 5,
    });

    // =========================================================
    // DASHBOARD RESPONSE
    // =========================================================

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
