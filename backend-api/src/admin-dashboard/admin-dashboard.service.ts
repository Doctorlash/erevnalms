import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminDashboardService {
  constructor(private prisma: PrismaService) {}

  async dashboard() {
    // =========================================================
    // USERS
    // =========================================================

    const totalUsers = await this.prisma.user.count();

    const totalStudents = await this.prisma.user.count({
      where: {
        role: 'STUDENT',
      },
    });

    const totalTeachers = await this.prisma.user.count({
      where: {
        role: 'TEACHER',
      },
    });

    // =========================================================
    // LEARNING CONTENT
    // =========================================================

    const totalSubjects = await this.prisma.subject.count();

    const totalLessons = await this.prisma.lesson.count();

    const totalAssignments = await this.prisma.assignment.count();

    const totalLiveClasses = await this.prisma.liveClass.count();

    // =========================================================
    // SUBSCRIPTIONS
    // =========================================================

    const totalSubscriptions = await this.prisma.subscription.count();

    const activeSubscriptions = await this.prisma.subscription.count({
      where: {
        status: 'ACTIVE',
      },
    });

    const pendingSubscriptions = await this.prisma.subscription.count({
      where: {
        status: 'PENDING',
      },
    });

    const expiredSubscriptions = await this.prisma.subscription.count({
      where: {
        status: 'EXPIRED',
      },
    });

    const cancelledSubscriptions = await this.prisma.subscription.count({
      where: {
        status: 'CANCELLED',
      },
    });

    // =========================================================
    // SUBSCRIPTION PLAN BREAKDOWN
    // =========================================================

    const freeSubscriptions = await this.prisma.subscription.count({
      where: {
        plan: 'FREE',
      },
    });

    const basicSubscriptions = await this.prisma.subscription.count({
      where: {
        plan: 'BASIC',
      },
    });

    const premiumSubscriptions = await this.prisma.subscription.count({
      where: {
        plan: 'PREMIUM',
      },
    });

    const schoolSubscriptions = await this.prisma.subscription.count({
      where: {
        plan: 'SCHOOL',
      },
    });

    // =========================================================
    // EXAMS
    // =========================================================

    const totalExams = await this.prisma.exam.count();

    const totalAttempts = await this.prisma.examAttempt.count();

    const completedAttempts = await this.prisma.examAttempt.findMany({
      where: {
        completed: true,
      },
    });

    const averageScore =
      completedAttempts.length > 0
        ? Math.round(
            completedAttempts.reduce((sum, attempt) => sum + attempt.score, 0) /
              completedAttempts.length,
          )
        : 0;

    const passedAttempts = completedAttempts.filter(
      (attempt) => attempt.score >= 50,
    ).length;

    const passRate =
      completedAttempts.length > 0
        ? Math.round((passedAttempts / completedAttempts.length) * 100)
        : 0;

    // =========================================================
    // RECENT USERS
    // =========================================================

    const recentUsers = await this.prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // =========================================================
    // RECENT EXAM ATTEMPTS
    // =========================================================

    const recentAttempts = await this.prisma.examAttempt.findMany({
      include: {
        user: true,
        exam: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: 10,
    });

    // =========================================================
    // RECENT SUBSCRIPTIONS
    // =========================================================

    const recentSubscriptions = await this.prisma.subscription.findMany({
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // =========================================================
    // RETURN DASHBOARD DATA
    // =========================================================

    return {
      statistics: {
        // Users
        totalUsers,
        totalStudents,
        totalTeachers,

        // Learning
        totalSubjects,
        totalLessons,
        totalAssignments,
        totalLiveClasses,

        // Subscriptions
        totalSubscriptions,
        activeSubscriptions,
        pendingSubscriptions,
        expiredSubscriptions,
        cancelledSubscriptions,

        // Plans
        freeSubscriptions,
        basicSubscriptions,
        premiumSubscriptions,
        schoolSubscriptions,

        // Exams
        totalExams,
        totalAttempts,
        averageScore,
        passRate,
      },

      recentUsers,

      recentAttempts,

      recentSubscriptions,
    };
  }
}
