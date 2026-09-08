import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { EnrollmentType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TopicsService {
  constructor(private prisma: PrismaService) {}

  // ============================================================
  // HELPER
  // CHECK ACTIVE SUBJECT ACCESS
  // ============================================================
  //
  // Access is granted when:
  //
  // 1. Student has a PAID enrollment
  // OR
  // 2. Student has a FREE enrollment that has not expired
  //
  // An expired FREE enrollment does NOT grant access.
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
    });

    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this subject.');
    }

    // ----------------------------------------------------------
    // PAID enrollment
    // ----------------------------------------------------------

    if (enrollment.type === EnrollmentType.PAID) {
      return enrollment;
    }

    // ----------------------------------------------------------
    // FREE enrollment
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
    // This now checks both enrollment AND expiry.
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

    // This now checks enrollment AND FREE expiry.
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
