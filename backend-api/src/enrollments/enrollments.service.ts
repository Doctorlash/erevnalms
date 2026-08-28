import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  async enroll(userId: string, subjectId: string) {
    return this.prisma.enrollment.create({
      data: {
        userId,
        subjectId,
      },
    });
  }

  async getStudentEnrollments(userId: string) {
    return this.prisma.enrollment.findMany({
      where: {
        userId,
      },
      include: {
        subject: true,
      },
    });
  }

  async getSubjectStudents(subjectId: string) {
    return this.prisma.enrollment.findMany({
      where: {
        subjectId,
      },
      include: {
        user: true,
      },
    });
  }
  async getTeacherStudents(teacherId: string) {
    return this.prisma.enrollment.findMany({
      where: {
        subject: {
          teacherId,
        },
      },
      include: {
        user: true,
        subject: true,
      },
      orderBy: {
        enrolledAt: 'desc',
      },
    });
  }
}
