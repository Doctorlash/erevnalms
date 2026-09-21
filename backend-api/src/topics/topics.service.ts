import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { EnrollmentType, StudentCohortStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TopicsService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // HELPER
  // CHECK CURRENT SUBJECT ACCESS
  // ============================================================
  //
  // FREE:
  //   enrollment exists
  //   + expiresAt > now
  //
  // PAID:
  //   enrollment exists
  //   + programme matches subject
  //   + StudentCohort exists and is ACTIVE
  //   + cohort exists
  //   + cohort is not CANCELLED
  //   + current date is before cohort.endDate
  //   + subscription exists and is ACTIVE
  //   + subscription has not expired
  //
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
      include: {
        subject: {
          select: {
            id: true,
            programme: true,
            isActive: true,
          },
        },
        studentCohort: {
          select: {
            id: true,
            status: true,
            userId: true,
            cohortId: true,
            cohort: {
              select: {
                id: true,
                programme: true,
                status: true,
                startDate: true,
                endDate: true,
              },
            },
            subscriptions: {
              where: {
                status: 'ACTIVE',
              },
              select: {
                id: true,
                status: true,
                startDate: true,
                endDate: true,
              },
              take: 1,
            },
          },
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this subject.');
    }

    if (!enrollment.subject.isActive) {
      throw new ForbiddenException('This subject is currently inactive.');
    }

    // ----------------------------------------------------------
    // PROGRAMME CONSISTENCY
    // ----------------------------------------------------------

    if (enrollment.programme !== enrollment.subject.programme) {
      throw new ForbiddenException(
        'Your enrollment is not valid for this subject programme.',
      );
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

    // ----------------------------------------------------------
    // PAID ACCESS
    // ----------------------------------------------------------

    if (enrollment.type === EnrollmentType.PAID) {
      const studentCohort = enrollment.studentCohort;

      if (!studentCohort) {
        throw new ForbiddenException(
          'Your paid enrollment is not linked to a cohort.',
        );
      }

      if (studentCohort.userId !== userId) {
        throw new ForbiddenException(
          'This cohort membership does not belong to you.',
        );
      }

      if (studentCohort.status !== StudentCohortStatus.ACTIVE) {
        throw new ForbiddenException(
          'Your access to this cohort is not currently active.',
        );
      }

      const cohort = studentCohort.cohort;

      if (!cohort) {
        throw new ForbiddenException(
          'Your paid enrollment is not linked to a valid cohort.',
        );
      }

      if (cohort.programme !== enrollment.subject.programme) {
        throw new ForbiddenException(
          'Your cohort programme does not match this subject programme.',
        );
      }

      if (cohort.status === 'CANCELLED') {
        throw new ForbiddenException('This cohort has been cancelled.');
      }

      if (now >= cohort.endDate) {
        throw new ForbiddenException(
          'This cohort has ended. Your access to this subject has expired.',
        );
      }

      // If the cohort has not started yet, paid content should
      // not become accessible early.
      if (now < cohort.startDate) {
        throw new ForbiddenException('This cohort has not started yet.');
      }

      if (!enrollment.expiresAt || enrollment.expiresAt <= now) {
        throw new ForbiddenException('Your paid enrollment has expired.');
      }

      const subscription = studentCohort.subscriptions[0];

      if (!subscription) {
        throw new ForbiddenException(
          'Your paid subscription is not currently active.',
        );
      }

      if (subscription.status !== 'ACTIVE') {
        throw new ForbiddenException(
          'Your paid subscription is not currently active.',
        );
      }

      if (!subscription.endDate || subscription.endDate <= now) {
        throw new ForbiddenException('Your subscription has expired.');
      }

      if (subscription.startDate && subscription.startDate > now) {
        throw new ForbiddenException('Your subscription has not started yet.');
      }

      return enrollment;
    }

    throw new ForbiddenException(
      'You do not currently have active access to this subject.',
    );
  }

  // ============================================================
  // ADMIN / GENERAL
  // CREATE TOPIC
  // ============================================================

  async create(data: {
    name: string;
    description?: string;
    subjectId: string;
  }) {
    const subject = await this.prisma.subject.findUnique({
      where: {
        id: data.subjectId,
      },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found.');
    }

    return this.prisma.topic.create({
      data,
    });
  }

  // ============================================================
  // ADMIN ONLY
  // GET ALL TOPICS
  // ============================================================

  async findAll() {
    return this.prisma.topic.findMany({
      include: {
        subject: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  // ============================================================
  // STUDENT
  // GET TOPICS BY SUBJECT
  // ============================================================

  async findBySubjectForStudent(userId: string, subjectId: string) {
    await this.requireActiveEnrollment(userId, subjectId);

    return this.prisma.topic.findMany({
      where: {
        subjectId,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  // ============================================================
  // ADMIN
  // GET TOPICS BY SUBJECT
  // ============================================================

  async findBySubject(subjectId: string) {
    return this.prisma.topic.findMany({
      where: {
        subjectId,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  // ============================================================
  // STUDENT
  // GET ONE TOPIC
  // ============================================================

  async findOneForStudent(userId: string, id: string) {
    const topic = await this.prisma.topic.findUnique({
      where: {
        id,
      },
      include: {
        subject: true,
      },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found.');
    }

    await this.requireActiveEnrollment(userId, topic.subjectId);

    return topic;
  }

  // ============================================================
  // ADMIN
  // GET ONE TOPIC
  // ============================================================

  async findOne(id: string) {
    const topic = await this.prisma.topic.findUnique({
      where: {
        id,
      },
      include: {
        subject: true,
      },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found.');
    }

    return topic;
  }

  // ============================================================
  // TEACHER
  // GET TOPICS FOR ASSIGNED SUBJECTS
  // ============================================================

  async teacherTopics(teacherId: string) {
    return this.prisma.topic.findMany({
      where: {
        subject: {
          teacherId,
        },
      },
      include: {
        subject: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}
