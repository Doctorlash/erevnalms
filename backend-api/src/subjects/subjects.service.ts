/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { EnrollmentType, StudentProgrammeType } from '@prisma/client';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ============================================================
   * ADMIN
   * CREATE SUBJECT
   * ============================================================
   *
   * Subjects belong to a specific programme:
   *
   * JAMB -> JAMB subjects
   * WAEC -> WAEC subjects
   *
   * Leadership Academy has been permanently removed.
   */
  async create(data: {
    name: string;
    description?: string;
    programme: StudentProgrammeType;
  }) {
    const name = data.name.trim();

    if (!name) {
      throw new BadRequestException('Subject name is required.');
    }

    if (
      data.programme !== StudentProgrammeType.JAMB &&
      data.programme !== StudentProgrammeType.WAEC
    ) {
      throw new BadRequestException('Programme must be either JAMB or WAEC.');
    }

    const existing = await this.prisma.subject.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
        programme: data.programme,
      },
    });

    if (existing) {
      throw new ConflictException(
        `A ${data.programme} subject with this name already exists.`,
      );
    }

    return this.prisma.subject.create({
      data: {
        name,
        description: data.description?.trim() || undefined,
        programme: data.programme,
      },
      include: {
        teacher: {
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
   * GET ALL SUBJECTS
   * ============================================================
   *
   * Can optionally be filtered by programme.
   */
  async findAll(programme?: StudentProgrammeType) {
    if (
      programme &&
      programme !== StudentProgrammeType.JAMB &&
      programme !== StudentProgrammeType.WAEC
    ) {
      throw new BadRequestException('Programme must be either JAMB or WAEC.');
    }

    return this.prisma.subject.findMany({
      where: programme
        ? {
            programme,
          }
        : undefined,
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            topics: true,
          },
        },
      },
      orderBy: [
        {
          programme: 'asc',
        },
        {
          name: 'asc',
        },
      ],
    });
  }
  async availableForStudent(programme: StudentProgrammeType) {
    if (
      programme !== StudentProgrammeType.JAMB &&
      programme !== StudentProgrammeType.WAEC
    ) {
      throw new BadRequestException('Programme must be either JAMB or WAEC.');
    }

    return this.prisma.subject.findMany({
      where: {
        programme,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        programme: true,
        isActive: true,
        teacherId: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
  async availableForTeacher(programme: StudentProgrammeType) {
    if (
      programme !== StudentProgrammeType.JAMB &&
      programme !== StudentProgrammeType.WAEC
    ) {
      throw new BadRequestException('Programme must be JAMB or WAEC');
    }

    return this.prisma.subject.findMany({
      where: {
        programme,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        programme: true,
        isActive: true,
        teacherId: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
  async availableForRegistration(programme: StudentProgrammeType) {
    if (
      programme !== StudentProgrammeType.JAMB &&
      programme !== StudentProgrammeType.WAEC
    ) {
      throw new BadRequestException('Programme must be either JAMB or WAEC.');
    }

    return this.prisma.subject.findMany({
      where: {
        programme,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        programme: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
  /**
   * ============================================================
   * STUDENT
   * GET MY SUBJECTS
   * ============================================================
   *
   * Returns ONLY subjects for which the authenticated student
   * has an approved enrollment.
   *
   * The programme is included so the frontend knows whether
   * the subject belongs to JAMB or WAEC.
   */
  async studentSubjects(userId: string) {
    const now = new Date();

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        userId,
        subject: {
          isActive: true,
        },
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
      include: {
        subject: {
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            _count: {
              select: {
                topics: true,
              },
            },
          },
        },
      },
      orderBy: [
        {
          programme: 'asc',
        },
        {
          subject: {
            name: 'asc',
          },
        },
      ],
    });

    return enrollments.map((enrollment) => ({
      enrollmentId: enrollment.id,
      programme: enrollment.programme,
      type: enrollment.type,
      enrolledAt: enrollment.enrolledAt,
      expiresAt: enrollment.expiresAt,
      subject: enrollment.subject,
    }));
  }

  /**
   * ============================================================
   * STUDENT
   * GET ONE SUBJECT
   * ============================================================
   *
   * A student can only access a subject if an enrollment exists
   * for that authenticated student.
   */
  async studentSubject(userId: string, subjectId: string) {
    const now = new Date();

    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId,
        subjectId,
        subject: {
          isActive: true,
        },
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
      include: {
        subject: {
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            _count: {
              select: {
                topics: true,
                Lesson: true,
                questions: true,
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException(
        'You do not currently have active access to this subject.',
      );
    }

    return {
      enrollmentId: enrollment.id,
      programme: enrollment.programme,
      type: enrollment.type,
      enrolledAt: enrollment.enrolledAt,
      expiresAt: enrollment.expiresAt,
      subject: enrollment.subject,
    };
  }
  /*===========================================================
   * ADMIN
   * GET ONE SUBJECT
   * ============================================================
   */
  async findOne(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: {
        id,
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            topics: true,
            Lesson: true,
            questions: true,
          },
        },
      },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found.');
    }

    return subject;
  }

  /**
   * ============================================================
   * ADMIN
   * DELETE SUBJECT
   * ============================================================
   */
  async delete(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: {
        id,
      },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found.');
    }

    return this.prisma.subject.delete({
      where: {
        id,
      },
    });
  }

  /**
   * ============================================================
   * ADMIN
   * ASSIGN TEACHER TO SUBJECT
   * ============================================================
   */
  async assignTeacher(subjectId: string, teacherId: string) {
    const teacher = await this.prisma.user.findUnique({
      where: {
        id: teacherId,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found.');
    }

    if (teacher.role !== 'TEACHER') {
      throw new ForbiddenException('Selected user is not a teacher.');
    }

    if (!teacher.isActive) {
      throw new ConflictException('This teacher account is not active.');
    }

    const subject = await this.prisma.subject.findUnique({
      where: {
        id: subjectId,
      },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found.');
    }

    return this.prisma.subject.update({
      where: {
        id: subjectId,
      },
      data: {
        teacherId,
      },
      include: {
        teacher: {
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
   * TEACHER
   * GET AUTHENTICATED TEACHER'S SUBJECTS
   * ============================================================
   */
  async teacherSubjects(teacherId: string) {
    return this.prisma.subject.findMany({
      where: {
        teacherId,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            enrollments: true,
            topics: true,
            Lesson: true,
          },
        },
      },
      orderBy: [
        {
          programme: 'asc',
        },
        {
          name: 'asc',
        },
      ],
    });
  }
}
