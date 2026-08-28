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
      _sum: {
        score: true,
      },
    });

    const users = await this.prisma.user.findMany();

    const sumMap = new Map<string, number>();

    sums.forEach((s) => {
      sumMap.set(s.userId, s._sum.score ?? 0);
    });

    return users
      .map((user) => ({
        userId: user.id,
        name: `${user.firstName} ${user.lastName}`,
        totalScore: sumMap.get(user.id) ?? 0,
      }))
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
    ]);

    const completedScoreAggregate = await this.prisma.examAttempt.aggregate({
      where: {
        completed: true,
      },
      _avg: {
        score: true,
      },
    });

    const averageScore = completedScoreAggregate._avg.score ?? 0;

    const recentAttempts = await this.prisma.examAttempt.findMany({
      where: {
        completed: true,
      },
      include: {
        user: true,
        exam: true,
      },
      orderBy: {
        createdAt: 'desc',
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

      performance: {
        averageScore,
      },

      recentAttempts,
      recentUsers,
    };
  }
}
