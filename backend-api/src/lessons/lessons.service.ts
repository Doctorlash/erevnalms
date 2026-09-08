import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { EnrollmentType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  // ============================================================
  // HELPER
  // CHECK ACTIVE SUBJECT ACCESS
  // ============================================================

  private async requireActiveEnrollment(userId: string, subjectId: string) {
    const now = new Date();

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_subjectId: {
          userId,
          subjectId,
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this subject.');
    }

    // ----------------------------------------------------------
    // PAID ACCESS
    // ----------------------------------------------------------

    if (enrollment.type === EnrollmentType.PAID) {
      return enrollment;
    }

    // ----------------------------------------------------------
    // FREE ACCESS
    // ----------------------------------------------------------

    if (enrollment.type === EnrollmentType.FREE) {
      if (!enrollment.expiresAt || enrollment.expiresAt <= now) {
        throw new ForbiddenException(
          'Your free access to this subject has expired. Please subscribe or make payment to continue.',
        );
      }

      return enrollment;
    }

    throw new ForbiddenException(
      'You do not currently have active access to this subject.',
    );
  }

  /**
   * ============================================================
   * TEACHER
   * CREATE LESSON
   * ============================================================
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
        createdById: teacherId,
        subjectId: topic.subjectId,
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
   * STUDENT
   * GET ALL PUBLISHED LESSONS
   * ============================================================
   *
   * Only lessons belonging to subjects for which the student
   * has active access are returned.
   */

  async findAll(userId: string) {
    const now = new Date();

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        userId,
        OR: [
          {
            type: EnrollmentType.PAID,
          },
          {
            type: EnrollmentType.FREE,
            expiresAt: {
              gt: now,
            },
          },
        ],
      },
      select: {
        subjectId: true,
      },
    });

    const subjectIds = enrollments.map((enrollment) => enrollment.subjectId);

    if (subjectIds.length === 0) {
      return [];
    }

    return this.prisma.lesson.findMany({
      where: {
        status: 'APPROVED',
        isPublished: true,
        subjectId: {
          in: subjectIds,
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
   * STUDENT
   * GET LESSONS BY TOPIC
   * ============================================================
   */

  async findByTopic(topicId: string, userId: string) {
    const topic = await this.prisma.topic.findUnique({
      where: {
        id: topicId,
      },
      select: {
        id: true,
        subjectId: true,
      },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    // Check active enrollment before returning lessons.
    await this.requireActiveEnrollment(userId, topic.subjectId);

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
   * STUDENT
   * GET ONE PUBLISHED LESSON
   * ============================================================
   */

  async findOne(id: string, userId: string) {
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

    // Check active enrollment before returning content.
    if (!lesson.subjectId) {
      throw new ForbiddenException('This lesson is not linked to a subject.');
    }

    await this.requireActiveEnrollment(userId, lesson.subjectId);

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
