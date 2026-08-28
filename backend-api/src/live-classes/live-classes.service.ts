import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateLiveClassDto } from './dto/create-live-class.dto';

@Injectable()
export class LiveClassesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateLiveClassDto) {
    return this.prisma.liveClass.create({
      data: {
        title: dto.title,
        subjectId: dto.subjectId,
        teacherId: dto.teacherId,
        meetingLink: dto.meetingLink,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
      },
    });
  }

  async findAll() {
    return this.prisma.liveClass.findMany({
      include: {
        subject: true,
        teacher: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.liveClass.findUnique({
      where: { id },
      include: {
        subject: true,
        teacher: true,
        attendances: true,
      },
    });
  }

  async joinClass(classId: string, studentId: string) {
    const liveClass = await this.prisma.liveClass.findUnique({
      where: {
        id: classId,
      },
    });

    if (!liveClass) {
      throw new NotFoundException('Class not found');
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_subjectId: {
          userId: studentId,
          subjectId: liveClass.subjectId,
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('You are not enrolled in this subject.');
    }

    const existingAttendance = await this.prisma.attendance.findUnique({
      where: {
        liveClassId_studentId: {
          liveClassId: classId,
          studentId,
        },
      },
    });

    if (existingAttendance) {
      return existingAttendance;
    }

    return this.prisma.attendance.create({
      data: {
        liveClassId: classId,
        studentId,
      },
    });
  }

  async attendance(classId: string) {
    return this.prisma.attendance.findMany({
      where: {
        liveClassId: classId,
      },
      include: {
        student: true,
      },
    });
  }

  async teacherClasses(teacherId: string) {
    return this.prisma.liveClass.findMany({
      where: {
        teacherId,
      },
      include: {
        subject: true,
      },
    });
  }

  async studentClasses(studentId: string) {
    return this.prisma.liveClass.findMany({
      where: {
        isActive: true,

        subject: {
          enrollments: {
            some: {
              userId: studentId,
            },
          },
        },
      },
      include: {
        subject: true,
        teacher: true,
        attendances: {
          where: {
            studentId,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  async teacherStats(teacherId: string) {
    const totalClasses = await this.prisma.liveClass.count({
      where: {
        teacherId,
      },
    });

    const attendance = await this.prisma.attendance.count({
      where: {
        liveClass: {
          teacherId,
        },
      },
    });

    return {
      totalClasses,
      attendance,
    };
  }
}
