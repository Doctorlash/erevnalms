import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { EnrollmentType, Prisma, StudentProgrammeType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ============================================================
   * HELPERS
   * ============================================================
   */

  /**
   * Maximum number of subjects a student may be enrolled in
   * for each programme.
   */
  private getProgrammeSubjectLimit(programme: StudentProgrammeType): number {
    if (programme === StudentProgrammeType.JAMB) {
      return 4;
    }

    if (programme === StudentProgrammeType.WAEC) {
      return 9;
    }

    throw new BadRequestException('Programme must be either JAMB or WAEC.');
  }

  /**
   * A FREE enrollment is consumed permanently.
   *
   * Even if the FREE enrollment has expired, it still means
   * the student has already used their one FREE subject.
   */
  private async hasUsedFreeEnrollment(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<boolean> {
    const freeEnrollment = await tx.enrollment.findFirst({
      where: {
        userId,
        type: EnrollmentType.FREE,
      },
      select: {
        id: true,
      },
    });

    return Boolean(freeEnrollment);
  }

  /**
   * ============================================================
   * ADMIN
   * ENROLL STUDENT INTO A SUBJECT
   * ============================================================
   *
   * This is an administrative/manual enrollment endpoint.
   *
   * IMPORTANT BUSINESS RULES:
   *
   * 1. Programme comes from Subject.programme.
   * 2. JAMB maximum = 4 subjects.
   * 3. WAEC maximum = 9 subjects.
   * 4. A student can receive only ONE FREE subject for life.
   * 5. FREE access lasts 7 days.
   * 6. Additional subjects are NOT automatically marked PAID.
   * 7. Payment must create the PAID enrollment later.
   *
   * Therefore this endpoint cannot be used to bypass the
   * one-free-subject or subject-limit rules.
   */
  async enroll(userId: string, subjectId: string) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      /**
       * --------------------------------------------------------
       * FIND STUDENT
       * --------------------------------------------------------
       */

      const user = await tx.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isActive: true,
        },
      });

      if (!user) {
        throw new NotFoundException('Student not found.');
      }

      if (user.role !== 'STUDENT') {
        throw new ConflictException(
          'Only students can be enrolled in subjects.',
        );
      }

      if (!user.isActive) {
        throw new ConflictException('This student account is not active.');
      }

      /**
       * --------------------------------------------------------
       * FIND SUBJECT
       * --------------------------------------------------------
       *
       * The programme is taken directly from the database.
       */

      const subject = await tx.subject.findUnique({
        where: {
          id: subjectId,
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
              email: true,
            },
          },
        },
      });

      if (!subject) {
        throw new NotFoundException('Subject not found.');
      }

      if (!subject.isActive) {
        throw new ConflictException(
          'This subject is inactive and cannot be enrolled.',
        );
      }

      const subjectLimit = this.getProgrammeSubjectLimit(subject.programme);

      /**
       * --------------------------------------------------------
       * CHECK EXISTING ENROLLMENT
       * --------------------------------------------------------
       */

      const existing = await tx.enrollment.findUnique({
        where: {
          userId_subjectId: {
            userId,
            subjectId,
          },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Student is already enrolled in ${subject.name} (${subject.programme}).`,
        );
      }

      /**
       * --------------------------------------------------------
       * CHECK PROGRAMME SUBJECT LIMIT
       * --------------------------------------------------------
       *
       * JAMB = maximum 4
       * WAEC = maximum 9
       *
       * We count actual enrollment records. An expired FREE
       * enrollment remains an enrollment and therefore remains
       * part of the student's selected/enrolled subject history.
       */

      const programmeEnrollmentCount = await tx.enrollment.count({
        where: {
          userId,
          programme: subject.programme,
        },
      });

      if (programmeEnrollmentCount >= subjectLimit) {
        throw new ConflictException(
          `The student has already reached the maximum of ${subjectLimit} ${subject.programme} subjects.`,
        );
      }

      /**
       * --------------------------------------------------------
       * CHECK ONE-TIME FREE ENTITLEMENT
       * --------------------------------------------------------
       */

      const hasUsedFree = await this.hasUsedFreeEnrollment(tx, userId);

      /**
       * --------------------------------------------------------
       * FIRST FREE SUBJECT
       * --------------------------------------------------------
       *
       * If the student has never consumed their FREE entitlement,
       * the administrative enrollment receives the same 7-day
       * FREE access rule.
       */

      if (!hasUsedFree) {
        const enrolledAt = new Date();

        const expiresAt = new Date(enrolledAt);
        expiresAt.setDate(expiresAt.getDate() + 7);

        try {
          const enrollment = await tx.enrollment.create({
            data: {
              userId,
              subjectId,
              programme: subject.programme,
              type: EnrollmentType.FREE,
              enrolledAt,
              expiresAt,
            },
            include: {
              subject: {
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
              },
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  role: true,
                },
              },
            },
          });

          return {
            message:
              'Student enrolled successfully. This is the student’s one free subject and access is valid for 7 days.',
            enrollment,
            access: 'FREE',
            expiresAt,
          };
        } catch (error) {
          /**
           * The database-level partial unique index protecting
           * one FREE enrollment per student is the final defense
           * against concurrent FREE enrollment creation.
           *
           * Convert a unique violation into a meaningful conflict.
           */
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
          ) {
            throw new ConflictException(
              'The student has already used their one free subject. Please use the payment process for additional subjects.',
            );
          }

          throw error;
        }
      }

      /**
       * --------------------------------------------------------
       * ADDITIONAL SUBJECT
       * --------------------------------------------------------
       *
       * Do NOT silently create a PAID enrollment.
       *
       * Payment/subscription must create the PAID enrollment when
       * the payment feature is implemented.
       */

      throw new ConflictException(
        'The student has already used their one free subject. This subject requires payment before enrollment can be granted.',
      );
    });
  }

  /**
   * ============================================================
   * STUDENT
   * GET AUTHENTICATED STUDENT'S ENROLLMENTS
   * ============================================================
   */
  async getStudentEnrollments(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Student account not found.');
    }

    if (user.role !== 'STUDENT') {
      throw new ConflictException(
        'Only students can access student enrollments.',
      );
    }

    return this.prisma.enrollment.findMany({
      where: {
        userId,
        subject: {
          isActive: true,
        },
      },
      select: {
        id: true,
        userId: true,
        subjectId: true,
        programme: true,
        type: true,
        enrolledAt: true,
        expiresAt: true,
        subject: {
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
                email: true,
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
  }

  /**
   * ============================================================
   * ADMIN
   * GET ALL STUDENTS ENROLLED IN A SUBJECT
   * ============================================================
   */
  async getSubjectStudents(subjectId: string) {
    const subject = await this.prisma.subject.findUnique({
      where: {
        id: subjectId,
      },
      select: {
        id: true,
        name: true,
        programme: true,
        isActive: true,
      },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found.');
    }

    return this.prisma.enrollment.findMany({
      where: {
        subjectId,
      },
      select: {
        id: true,
        userId: true,
        subjectId: true,
        programme: true,
        type: true,
        enrolledAt: true,
        expiresAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            programme: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        enrolledAt: 'desc',
      },
    });
  }

  /**
   * ============================================================
   * TEACHER
   * GET STUDENTS ENROLLED IN TEACHER'S SUBJECTS
   * ============================================================
   */
  async getTeacherStudents(teacherId: string) {
    const teacher = await this.prisma.user.findUnique({
      where: {
        id: teacherId,
      },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher account not found.');
    }

    if (teacher.role !== 'TEACHER') {
      throw new ConflictException(
        'Only teachers can access teacher enrollments.',
      );
    }

    return this.prisma.enrollment.findMany({
      where: {
        subject: {
          teacherId,
          isActive: true,
        },
        user: {
          role: 'STUDENT',
          isActive: true,
        },
      },
      select: {
        id: true,
        userId: true,
        subjectId: true,
        programme: true,
        type: true,
        enrolledAt: true,
        expiresAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            description: true,
            programme: true,
            teacherId: true,
          },
        },
      },
      orderBy: {
        enrolledAt: 'desc',
      },
    });
  }

  /**
   * ============================================================
   * ADMIN
   * REMOVE STUDENT FROM SUBJECT
   * ============================================================
   */
  async removeEnrollment(userId: string, subjectId: string) {
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
            name: true,
            programme: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found.');
    }

    if (enrollment.user.role !== 'STUDENT') {
      throw new BadRequestException('The selected user is not a student.');
    }

    const deleted = await this.prisma.enrollment.delete({
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
            name: true,
            programme: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return {
      message: 'Student enrollment removed successfully.',
      enrollment: deleted,
    };
  }
}
