import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeacherDashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(teacherId: string) {
    const subjects = await this.prisma.subject.count({
      where: {
        teacherId,
      },
    });

    const topics = await this.prisma.topic.count({
      where: {
        subject: {
          teacherId,
        },
      },
    });

    const lessons = await this.prisma.lesson.count({
      where: {
        topic: {
          subject: {
            teacherId,
          },
        },
      },
    });

    const questions = await this.prisma.question.count({
      where: {
        subject: {
          teacherId,
        },
      },
    });

    const exams = await this.prisma.exam.count({
      where: {
        subject: {
          teacherId,
        },
      },
    });

    const assignments = await this.prisma.assignment.count({
      where: {
        teacherId,
      },
    });

    const liveClasses = await this.prisma.liveClass.count({
      where: {
        teacherId,
      },
    });

    const announcements = await this.prisma.announcement.count({
      where: {
        teacherId,
      },
    });

    const assignedSubjects = await this.prisma.subject.findMany({
      where: {
        teacherId,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    const upcomingClasses = await this.prisma.liveClass.findMany({
      where: {
        teacherId,
        startTime: {
          gte: new Date(),
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      take: 5,
      include: {
        subject: true,
      },
    });

    const recentAssignments = await this.prisma.assignment.findMany({
      where: {
        teacherId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      include: {
        subject: true,
      },
    });

    return {
      stats: {
        subjects,
        topics,
        lessons,
        questions,
        exams,
        assignments,
        liveClasses,
        announcements,
      },

      assignedSubjects,

      upcomingClasses,

      recentAssignments,
    };
  }
}
