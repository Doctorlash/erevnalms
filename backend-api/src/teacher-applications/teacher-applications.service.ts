import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { StudentProgrammeType, TeacherApplicationStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeacherApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ============================================================
   * VALIDATE PROGRAMME
   * ============================================================
   */
  private validateProgramme(programme: StudentProgrammeType) {
    if (
      programme !== StudentProgrammeType.JAMB &&
      programme !== StudentProgrammeType.WAEC
    ) {
      throw new BadRequestException('Programme must be either JAMB or WAEC.');
    }
  }

  /**
   * ============================================================
   * TEACHER
   * APPLY FOR A SUBJECT
   * ============================================================
   */
  async apply(
    teacherId: string,
    subjectId: string,
    programme: StudentProgrammeType,
  ) {
    this.validateProgramme(programme);

    const teacher = await this.prisma.user.findUnique({
      where: {
        id: teacherId,
      },
      include: {
        teacherProfile: true,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found.');
    }

    if (teacher.role !== 'TEACHER') {
      throw new ForbiddenException('Only teachers can apply for subjects.');
    }

    if (!teacher.isActive) {
      throw new ForbiddenException('Your teacher account is not active.');
    }

    if (!teacher.teacherProfile) {
      throw new BadRequestException(
        'Please complete your teacher profile before applying for subjects.',
      );
    }

    const subject = await this.prisma.subject.findUnique({
      where: {
        id: subjectId,
      },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found.');
    }

    if (!subject.isActive) {
      throw new BadRequestException('This subject is not currently available.');
    }

    if (subject.programme !== programme) {
      throw new BadRequestException(
        `This subject belongs to the ${subject.programme} programme, not ${programme}.`,
      );
    }

    if (subject.teacherId === teacherId) {
      throw new ConflictException('You are already assigned to this subject.');
    }

    if (subject.teacherId && subject.teacherId !== teacherId) {
      throw new ConflictException(
        'This subject is already assigned to another teacher.',
      );
    }

    const existing = await this.prisma.teacherSubjectApplication.findUnique({
      where: {
        teacherId_subjectId_programme: {
          teacherId,
          subjectId,
          programme,
        },
      },
    });

    if (existing) {
      if (existing.status === TeacherApplicationStatus.PENDING) {
        throw new ConflictException(
          'You already have a pending application for this subject.',
        );
      }

      if (existing.status === TeacherApplicationStatus.APPROVED) {
        throw new ConflictException(
          'Your application for this subject has already been approved.',
        );
      }

      if (existing.status === TeacherApplicationStatus.REJECTED) {
        const updated = await this.prisma.teacherSubjectApplication.update({
          where: {
            id: existing.id,
          },
          data: {
            status: TeacherApplicationStatus.PENDING,
            rejectionReason: null,
            reviewedAt: null,
            requestedAt: new Date(),
          },
          include: {
            subject: true,
          },
        });

        return {
          message: 'Subject application resubmitted successfully.',
          application: updated,
        };
      }
    }

    const application = await this.prisma.teacherSubjectApplication.create({
      data: {
        teacherId,
        subjectId,
        programme,
        status: TeacherApplicationStatus.PENDING,
      },
      include: {
        subject: true,
      },
    });

    return {
      message: 'Subject application submitted successfully.',
      application,
    };
  }

  /**
   * ============================================================
   * TEACHER
   * GET MY APPLICATIONS
   * ============================================================
   */
  async myApplications(teacherId: string) {
    const teacher = await this.prisma.user.findUnique({
      where: {
        id: teacherId,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found.');
    }

    if (teacher.role !== 'TEACHER') {
      throw new ForbiddenException(
        'Only teachers can view teacher applications.',
      );
    }

    return this.prisma.teacherSubjectApplication.findMany({
      where: {
        teacherId,
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            description: true,
            programme: true,
            isActive: true,
            teacherId: true,
          },
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
    });
  }

  /**
   * ============================================================
   * ADMIN
   * GET ALL APPLICATIONS
   * ============================================================
   */
  async adminAll(status?: TeacherApplicationStatus) {
    if (
      status &&
      status !== TeacherApplicationStatus.PENDING &&
      status !== TeacherApplicationStatus.APPROVED &&
      status !== TeacherApplicationStatus.REJECTED
    ) {
      throw new BadRequestException(
        'Status must be PENDING, APPROVED, or REJECTED.',
      );
    }

    return this.prisma.teacherSubjectApplication.findMany({
      where: status
        ? {
            status,
          }
        : undefined,
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isActive: true,
            teacherProfile: {
              select: {
                qualification: true,
                specialization: true,
                experience: true,
                about: true,
              },
            },
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            description: true,
            programme: true,
            isActive: true,
            teacherId: true,
          },
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
    });
  }

  /**
   * ============================================================
   * ADMIN
   * GET ONE APPLICATION
   * ============================================================
   */
  async adminOne(id: string) {
    const application = await this.prisma.teacherSubjectApplication.findUnique({
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
            isActive: true,
            teacherProfile: {
              select: {
                qualification: true,
                specialization: true,
                experience: true,
                officeHours: true,
                about: true,
                linkedin: true,
                website: true,
                twitter: true,
              },
            },
          },
        },
        subject: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Teacher subject application not found.');
    }

    return application;
  }

  /**
   * ============================================================
   * ADMIN
   * APPROVE APPLICATION
   *
   * IMPORTANT:
   * The subject is claimed atomically using:
   *
   *   WHERE id = subjectId AND teacherId IS NULL
   *
   * This prevents two admins from approving different teachers
   * for the same subject at the same time.
   *
   * The application status is also changed atomically using:
   *
   *   WHERE id = applicationId AND status = PENDING
   *
   * If either operation fails, the entire transaction rolls back.
   * ============================================================
   */
  async approve(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const application = await tx.teacherSubjectApplication.findUnique({
        where: {
          id,
        },
        include: {
          teacher: true,
          subject: true,
        },
      });

      if (!application) {
        throw new NotFoundException('Teacher subject application not found.');
      }

      if (application.status !== TeacherApplicationStatus.PENDING) {
        throw new ConflictException(
          'Only pending applications can be approved.',
        );
      }

      if (application.teacher.role !== 'TEACHER') {
        throw new ForbiddenException('The applicant is no longer a teacher.');
      }

      if (!application.teacher.isActive) {
        throw new ForbiddenException('The teacher account is not active.');
      }

      if (!application.subject.isActive) {
        throw new ConflictException('This subject is no longer active.');
      }

      if (application.subject.programme !== application.programme) {
        throw new ConflictException(
          'The application programme does not match the subject programme.',
        );
      }

      /**
       * ========================================================
       * ATOMIC SUBJECT CLAIM
       * ========================================================
       *
       * Only the first transaction that finds teacherId = NULL
       * can claim the subject.
       *
       * If another teacher has already been assigned, count = 0.
       *
       * The transaction then fails and rolls back completely.
       */
      const subjectClaim = await tx.subject.updateMany({
        where: {
          id: application.subjectId,
          teacherId: null,
        },
        data: {
          teacherId: application.teacherId,
        },
      });

      if (subjectClaim.count !== 1) {
        throw new ConflictException(
          'This subject has already been assigned to another teacher.',
        );
      }

      /**
       * ========================================================
       * ATOMIC APPLICATION APPROVAL
       * ========================================================
       *
       * This protects against two admins approving the same
       * application simultaneously.
       */
      const applicationUpdate = await tx.teacherSubjectApplication.updateMany({
        where: {
          id,
          status: TeacherApplicationStatus.PENDING,
        },
        data: {
          status: TeacherApplicationStatus.APPROVED,
          rejectionReason: null,
          reviewedAt: new Date(),
        },
      });

      if (applicationUpdate.count !== 1) {
        throw new ConflictException(
          'This application has already been reviewed.',
        );
      }

      /**
       * Fetch the final records after both atomic operations
       * have succeeded.
       */
      const updatedApplication = await tx.teacherSubjectApplication.findUnique({
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
          subject: true,
        },
      });

      const subject = await tx.subject.findUnique({
        where: {
          id: application.subjectId,
        },
      });

      if (!updatedApplication || !subject) {
        throw new NotFoundException(
          'Unable to retrieve the approved teacher assignment.',
        );
      }

      return {
        message: 'Teacher subject application approved successfully.',
        application: updatedApplication,
        subject,
      };
    });
  }

  /**
   * ============================================================
   * ADMIN
   * REJECT APPLICATION
   * ============================================================
   */
  async reject(id: string, rejectionReason: string) {
    const reason = rejectionReason?.trim();

    if (!reason) {
      throw new BadRequestException('A rejection reason is required.');
    }

    const application = await this.prisma.teacherSubjectApplication.findUnique({
      where: {
        id,
      },
    });

    if (!application) {
      throw new NotFoundException('Teacher subject application not found.');
    }

    if (application.status !== TeacherApplicationStatus.PENDING) {
      throw new ConflictException('Only pending applications can be rejected.');
    }

    const updated = await this.prisma.teacherSubjectApplication.updateMany({
      where: {
        id,
        status: TeacherApplicationStatus.PENDING,
      },
      data: {
        status: TeacherApplicationStatus.REJECTED,
        rejectionReason: reason,
        reviewedAt: new Date(),
      },
    });

    if (updated.count !== 1) {
      throw new ConflictException(
        'This application has already been reviewed.',
      );
    }

    return this.prisma.teacherSubjectApplication.findUnique({
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
        subject: true,
      },
    });
  }
}
