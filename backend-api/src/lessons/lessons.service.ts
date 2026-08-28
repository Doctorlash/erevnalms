import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  /**
   * ============================================================
   * TEACHER
   * CREATE LESSON
   * ============================================================
   *
   * Creates a new lesson as DRAFT.
   *
   * The teacher:
   * - Must own the subject
   * - Must own the subject to which the topic belongs
   * - Cannot publish the lesson directly
   */
  async create(data: CreateLessonDto, teacherId: string) {
    const topic = await this.prisma.topic.findUnique({
      where: {
        id: data.topicId,
      },
      include: {
        subject: true,
      },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    if (!topic.subject.teacherId) {
      throw new BadRequestException(
        'This subject has no teacher assigned to it',
      );
    }

    if (topic.subject.teacherId !== teacherId) {
      throw new ForbiddenException(
        'You can only create lessons for your assigned subjects',
      );
    }

    return this.prisma.lesson.create({
      data: {
        title: data.title,
        content: data.content,
        topicId: data.topicId,
        description: data.description,
        videoUrl: data.videoUrl,
        duration: data.duration,

        // Teacher who created the lesson
        createdById: teacherId,

        // Automatically inherit the subject from the topic
        subjectId: topic.subjectId,

        // New lessons always begin as drafts
        status: 'DRAFT',
        isPublished: false,
      },

      include: {
        topic: {
          include: {
            subject: true,
          },
        },

        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * ============================================================
   * STUDENTS / AUTHENTICATED USERS
   * GET ALL PUBLISHED LESSONS
   * ============================================================
   *
   * Students should only see:
   *
   * status = APPROVED
   * isPublished = true
   */
  async findAll() {
    return this.prisma.lesson.findMany({
      where: {
        status: 'APPROVED',
        isPublished: true,
      },

      include: {
        topic: {
          include: {
            subject: true,
          },
        },

        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },

        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * ============================================================
   * ADMIN
   * GET PENDING LESSONS
   * ============================================================
   *
   * Used by:
   *
   * GET /lessons/admin/pending
   *
   * Returns only lessons waiting for administrator approval.
   *
   * Includes:
   * - Full lesson content
   * - Description
   * - Video URL
   * - Duration
   * - Teacher
   * - Subject
   * - Topic
   * - Submission/creation dates
   */
  async adminPendingLessons() {
    return this.prisma.lesson.findMany({
      where: {
        status: 'PENDING_APPROVAL',
      },

      include: {
        topic: {
          include: {
            subject: true,
          },
        },

        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },

      orderBy: {
        updatedAt: 'asc',
      },
    });
  }

  /**
   * ============================================================
   * AUTHENTICATED USERS
   * GET LESSONS BY TOPIC
   * ============================================================
   *
   * Only approved and published lessons are returned.
   */
  async findByTopic(topicId: string) {
    return this.prisma.lesson.findMany({
      where: {
        topicId,
        status: 'APPROVED',
        isPublished: true,
      },

      include: {
        topic: {
          include: {
            subject: true,
          },
        },

        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * ============================================================
   * TEACHER
   * GET TEACHER'S LESSONS
   * ============================================================
   *
   * Returns lessons belonging to subjects assigned
   * to the authenticated teacher.
   *
   * Includes:
   * - DRAFT
   * - PENDING_APPROVAL
   * - APPROVED
   * - REJECTED
   */
  async teacherLessons(teacherId: string) {
    return this.prisma.lesson.findMany({
      where: {
        topic: {
          subject: {
            teacherId,
          },
        },
      },

      include: {
        topic: {
          include: {
            subject: true,
          },
        },

        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },

        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * ============================================================
   * TEACHER
   * SUBMIT LESSON FOR APPROVAL
   * ============================================================
   *
   * A teacher can submit:
   *
   * DRAFT -> PENDING_APPROVAL
   *
   * REJECTED -> PENDING_APPROVAL
   */
  async submitForApproval(id: string, teacherId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: {
        id,
      },

      include: {
        topic: {
          include: {
            subject: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (lesson.createdById !== teacherId) {
      throw new ForbiddenException(
        'You can only submit your own lessons for approval',
      );
    }

    if (lesson.topic.subject.teacherId !== teacherId) {
      throw new ForbiddenException(
        'You can only submit lessons belonging to your assigned subjects',
      );
    }

    if (lesson.status !== 'DRAFT' && lesson.status !== 'REJECTED') {
      throw new BadRequestException(
        'Only draft or rejected lessons can be submitted for approval',
      );
    }

    return this.prisma.lesson.update({
      where: {
        id,
      },

      data: {
        status: 'PENDING_APPROVAL',
        isPublished: false,
        rejectionReason: null,
      },

      include: {
        topic: {
          include: {
            subject: true,
          },
        },

        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * ============================================================
   * ADMIN
   * APPROVE LESSON
   * ============================================================
   *
   * PENDING_APPROVAL -> APPROVED
   *
   * Once approved:
   * - isPublished = true
   * - approvedAt is recorded
   * - approvedById is recorded
   * - rejectionReason is cleared
   */
  async approve(id: string, adminId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: {
        id,
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (lesson.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(
        'Only lessons pending approval can be approved',
      );
    }

    return this.prisma.lesson.update({
      where: {
        id,
      },

      data: {
        status: 'APPROVED',
        isPublished: true,
        approvedAt: new Date(),
        approvedById: adminId,
        rejectionReason: null,
      },

      include: {
        topic: {
          include: {
            subject: true,
          },
        },

        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },

        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * ============================================================
   * ADMIN
   * REJECT LESSON
   * ============================================================
   *
   * PENDING_APPROVAL -> REJECTED
   *
   * Rejected lessons are not published.
   */
  async reject(id: string, reason?: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: {
        id,
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (lesson.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(
        'Only lessons pending approval can be rejected',
      );
    }

    const rejectionMessage =
      reason?.trim() || 'Lesson requires revision before approval';

    return this.prisma.lesson.update({
      where: {
        id,
      },

      data: {
        status: 'REJECTED',
        isPublished: false,
        rejectionReason: rejectionMessage,
        approvedAt: null,
        approvedById: null,
      },

      include: {
        topic: {
          include: {
            subject: true,
          },
        },

        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * ============================================================
   * AUTHENTICATED USERS
   * GET ONE PUBLISHED LESSON
   * ============================================================
   *
   * Students cannot retrieve drafts, rejected lessons,
   * or pending lessons through this endpoint.
   */
  async findOne(id: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: {
        id,
        status: 'APPROVED',
        isPublished: true,
      },

      include: {
        topic: {
          include: {
            subject: true,
          },
        },

        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },

        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return lesson;
  }

  /**
   * ============================================================
   * ADMIN
   * DELETE LESSON
   * ============================================================
   */
  async delete(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: {
        id,
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return this.prisma.lesson.delete({
      where: {
        id,
      },
    });
  }
}
