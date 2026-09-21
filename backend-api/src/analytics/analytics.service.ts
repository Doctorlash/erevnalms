import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async studentOverview(userId: string) {
    const attempts = await this.prisma.examAttempt.findMany({
      where: {
        userId,
        completed: true,
      },
      include: {
        exam: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    const totalExams = attempts.length;

    const totalScore = attempts.reduce(
      (sum, attempt) => sum + attempt.score,
      0,
    );

    const averageScore = totalExams > 0 ? totalScore / totalExams : 0;

    return {
      totalExams,
      totalScore,
      averageScore,
      attempts,
    };
  }

  async leaderboard() {
    const sums = await this.prisma.examAttempt.groupBy({
      by: ['userId'],
      where: {
        completed: true,
      },
      _sum: {
        score: true,
      },
    });

    if (sums.length === 0) {
      return [];
    }

    const userIds = sums.map((item) => item.userId);

    const users = await this.prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    const userMap = new Map(users.map((user) => [user.id, user]));

    return sums
      .map((sum) => {
        const user = userMap.get(sum.userId);

        return {
          userId: sum.userId,
          name: user
            ? `${user.firstName} ${user.lastName}`.trim()
            : 'Unknown Student',
          totalScore: sum._sum.score ?? 0,
        };
      })
      .sort((a, b) => b.totalScore - a.totalScore);
  }

  async adminOverview() {
    const [
      totalUsers,
      totalStudents,
      totalTeachers,
      totalSubjects,
      totalLessons,
      totalAssignments,
      totalExams,
      totalAttempts,
      completedAttempts,
      totalEnrollments,
      totalCertificates,

      jambStudents,
      waecStudents,

      totalCohorts,
      upcomingCohorts,
      activeCohorts,
      endedCohorts,
      totalCohortMemberships,

      totalSubscriptions,
      activeSubscriptions,
      pendingSubscriptions,
      expiredSubscriptions,

      totalPayments,
      paidPayments,
      pendingPayments,
      failedPayments,
      refundedPayments,

      completedScoreAggregate,
    ] = await Promise.all([
      this.prisma.user.count(),

      this.prisma.user.count({
        where: {
          role: 'STUDENT',
        },
      }),

      this.prisma.user.count({
        where: {
          role: 'TEACHER',
        },
      }),

      this.prisma.subject.count(),

      this.prisma.lesson.count(),

      this.prisma.assignment.count(),

      this.prisma.exam.count(),

      this.prisma.examAttempt.count(),

      this.prisma.examAttempt.count({
        where: {
          completed: true,
        },
      }),

      this.prisma.enrollment.count(),

      this.prisma.certificate.count(),

      this.prisma.studentProgramme.count({
        where: {
          programme: 'JAMB',
        },
      }),

      this.prisma.studentProgramme.count({
        where: {
          programme: 'WAEC',
        },
      }),

      this.prisma.cohort.count(),

      this.prisma.cohort.count({
        where: {
          status: 'UPCOMING',
        },
      }),

      this.prisma.cohort.count({
        where: {
          status: 'ACTIVE',
        },
      }),

      this.prisma.cohort.count({
        where: {
          status: 'ENDED',
        },
      }),

      this.prisma.studentCohort.count(),

      this.prisma.subscription.count(),

      this.prisma.subscription.count({
        where: {
          status: 'ACTIVE',
        },
      }),

      this.prisma.subscription.count({
        where: {
          status: 'PENDING',
        },
      }),

      this.prisma.subscription.count({
        where: {
          status: 'EXPIRED',
        },
      }),

      this.prisma.payment.count(),

      this.prisma.payment.count({
        where: {
          status: 'PAID',
        },
      }),

      this.prisma.payment.count({
        where: {
          status: 'PENDING',
        },
      }),

      this.prisma.payment.count({
        where: {
          status: 'FAILED',
        },
      }),

      this.prisma.payment.count({
        where: {
          status: 'REFUNDED',
        },
      }),

      this.prisma.examAttempt.aggregate({
        where: {
          completed: true,
        },
        _avg: {
          score: true,
        },
      }),
    ]);

    const paidRevenueAggregate = await this.prisma.payment.aggregate({
      where: {
        status: 'PAID',
      },
      _sum: {
        amount: true,
      },
    });

    const averageScore = completedScoreAggregate._avg.score ?? 0;

    const totalRevenue = paidRevenueAggregate._sum.amount ?? 0;

    const recentAttempts = await this.prisma.examAttempt.findMany({
      where: {
        completed: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        exam: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: 10,
    });

    const recentUsers = await this.prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return {
      users: {
        total: totalUsers,
        students: totalStudents,
        teachers: totalTeachers,
      },

      programmes: {
        jambStudents,
        waecStudents,
      },

      academic: {
        subjects: totalSubjects,
        lessons: totalLessons,
        assignments: totalAssignments,
        exams: totalExams,
        attempts: totalAttempts,
        completedAttempts,
        enrollments: totalEnrollments,
        certificates: totalCertificates,
      },

      cohorts: {
        total: totalCohorts,
        upcoming: upcomingCohorts,
        active: activeCohorts,
        ended: endedCohorts,
        memberships: totalCohortMemberships,
      },

      subscriptions: {
        total: totalSubscriptions,
        active: activeSubscriptions,
        pending: pendingSubscriptions,
        expired: expiredSubscriptions,
      },

      payments: {
        total: totalPayments,
        paid: paidPayments,
        pending: pendingPayments,
        failed: failedPayments,
        refunded: refundedPayments,
        totalRevenue,
      },

      performance: {
        averageScore,
      },

      recentAttempts,
      recentUsers,
    };
  }
}
