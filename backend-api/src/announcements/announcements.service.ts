import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  // =========================================================
  // CREATE ANNOUNCEMENT
  // =========================================================

  async create(dto: CreateAnnouncementDto) {
    const teacher = await this.prisma.user.findUnique({
      where: {
        id: dto.teacherId,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    if (teacher.role !== 'TEACHER') {
      throw new NotFoundException('User is not a teacher');
    }

    // ---------------------------------------------------------
    // CREATE ANNOUNCEMENT
    // ---------------------------------------------------------

    const announcement = await this.prisma.announcement.create({
      data: {
        title: dto.title,
        message: dto.message,
        teacherId: dto.teacherId,
        subjectId: dto.subjectId || null,
      },
      include: {
        teacher: true,
        subject: true,
      },
    });

    // ---------------------------------------------------------
    // FIND STUDENTS TO NOTIFY
    // ---------------------------------------------------------

    let studentIds: string[] = [];

    if (dto.subjectId) {
      // Subject-specific announcement
      const enrollments = await this.prisma.enrollment.findMany({
        where: {
          subjectId: dto.subjectId,
          user: {
            role: 'STUDENT',
          },
        },
        select: {
          userId: true,
        },
      });

      studentIds = enrollments.map((enrollment) => enrollment.userId);
    } else {
      // General announcement
      const students = await this.prisma.user.findMany({
        where: {
          role: 'STUDENT',
        },
        select: {
          id: true,
        },
      });

      studentIds = students.map((student) => student.id);
    }

    // ---------------------------------------------------------
    // CREATE NOTIFICATIONS
    // ---------------------------------------------------------

    if (studentIds.length > 0) {
      await this.prisma.notification.createMany({
        data: studentIds.map((studentId) => ({
          userId: studentId,
          title: announcement.title,
          message: announcement.message,
        })),
      });
    }

    // ---------------------------------------------------------
    // RETURN RESULT
    // ---------------------------------------------------------

    return {
      announcement,
      notificationsCreated: studentIds.length,
    };
  }

  // =========================================================
  // FIND ALL ANNOUNCEMENTS
  // =========================================================

  async findAll() {
    return this.prisma.announcement.findMany({
      include: {
        teacher: true,
        subject: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // =========================================================
  // FIND ONE ANNOUNCEMENT
  // =========================================================

  async findOne(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: {
        id,
      },
      include: {
        teacher: true,
        subject: true,
      },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    return announcement;
  }

  // =========================================================
  // SUBJECT ANNOUNCEMENTS
  // =========================================================

  async subjectAnnouncements(subjectId: string) {
    return this.prisma.announcement.findMany({
      where: {
        subjectId,
        isPublished: true,
      },
      include: {
        teacher: true,
        subject: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // =========================================================
  // TEACHER ANNOUNCEMENTS
  // =========================================================

  async teacherAnnouncements(teacherId: string) {
    return this.prisma.announcement.findMany({
      where: {
        teacherId,
      },
      include: {
        subject: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // =========================================================
  // PUBLISH
  // =========================================================

  async publish(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: {
        id,
      },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    return this.prisma.announcement.update({
      where: {
        id,
      },
      data: {
        isPublished: true,
      },
    });
  }

  // =========================================================
  // UNPUBLISH
  // =========================================================

  async unpublish(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: {
        id,
      },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    return this.prisma.announcement.update({
      where: {
        id,
      },
      data: {
        isPublished: false,
      },
    });
  }
}
