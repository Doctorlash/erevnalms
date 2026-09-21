import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CohortStatus,
  StudentCohortStatus,
  StudentProgrammeType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCohortDto } from './dto/create-cohort.dto';
import { UpdateCohortDto } from './dto/update-cohort.dto';
import { AssignStudentDto } from './dto/assign-student.dto';

@Injectable()
export class CohortsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate the effective cohort status from its dates.
   *
   * CANCELLED is an explicit administrative state and always wins.
   *
   * Date-based states:
   * - before startDate  -> UPCOMING
   * - from startDate up to endDate -> ACTIVE
   * - at/after endDate -> ENDED
   */
  private getEffectiveStatus(cohort: {
    status: CohortStatus;
    startDate: Date;
    endDate: Date;
  }): CohortStatus {
    if (cohort.status === CohortStatus.CANCELLED) {
      return CohortStatus.CANCELLED;
    }

    const now = new Date();

    if (now < cohort.startDate) {
      return CohortStatus.UPCOMING;
    }

    if (now >= cohort.endDate) {
      return CohortStatus.ENDED;
    }

    return CohortStatus.ACTIVE;
  }

  /**
   * Validate that a cohort has a valid date range.
   */
  private validateDateRange(startDate: Date, endDate: Date): void {
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid cohort start or end date.');
    }

    if (endDate <= startDate) {
      throw new BadRequestException(
        'Cohort end date must be after the start date.',
      );
    }
  }

  /**
   * Validate the cohort name.
   */
  private validateName(name: string): string {
    const trimmedName = name.trim();

    if (!trimmedName) {
      throw new BadRequestException('Cohort name cannot be empty.');
    }

    return trimmedName;
  }

  /**
   * Validate cohort fee.
   *
   * Fees are stored as integer NGN amounts.
   */
  private validateFee(fee: number): void {
    if (!Number.isInteger(fee) || fee < 0) {
      throw new BadRequestException(
        'Cohort fee must be a non-negative integer.',
      );
    }
  }

  /**
   * Ensure the programme is one of the supported LMS programmes.
   *
   * The Prisma enum currently contains only JAMB and WAEC,
   * but this explicit validation protects the business rule.
   */
  private validateProgramme(programme: StudentProgrammeType): void {
    if (
      programme !== StudentProgrammeType.JAMB &&
      programme !== StudentProgrammeType.WAEC
    ) {
      throw new BadRequestException('Cohort programme must be JAMB or WAEC.');
    }
  }

  /**
   * Create a cohort.
   */
  async create(dto: CreateCohortDto) {
    const name = this.validateName(dto.name);

    this.validateProgramme(dto.programme);
    this.validateFee(dto.fee);

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    this.validateDateRange(startDate, endDate);

    const existing = await this.prisma.cohort.findFirst({
      where: {
        name,
        programme: dto.programme,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      throw new ConflictException(
        'A cohort with this name already exists for this programme.',
      );
    }

    return this.prisma.cohort.create({
      data: {
        name,
        programme: dto.programme,
        description: dto.description?.trim() || null,
        startDate,
        endDate,
        fee: dto.fee,
        status: CohortStatus.UPCOMING,
      },
    });
  }

  /**
   * Return all cohorts with useful administrative counts.
   */
  async findAll() {
    const cohorts = await this.prisma.cohort.findMany({
      include: {
        _count: {
          select: {
            students: true,
            payments: true,
            subscriptions: true,
          },
        },
      },
      orderBy: [
        {
          startDate: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });

    return cohorts.map((cohort) => ({
      ...cohort,
      effectiveStatus: this.getEffectiveStatus(cohort),
    }));
  }

  /**
   * Return a single cohort with its students.
   */
  async findOne(id: string) {
    const cohort = await this.prisma.cohort.findUnique({
      where: {
        id,
      },
      include: {
        students: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                isActive: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'desc',
          },
        },
        _count: {
          select: {
            students: true,
            payments: true,
            subscriptions: true,
          },
        },
      },
    });

    if (!cohort) {
      throw new NotFoundException('Cohort not found.');
    }

    return {
      ...cohort,
      effectiveStatus: this.getEffectiveStatus(cohort),
    };
  }

  /**
   * Update cohort information.
   *
   * Historical records are preserved. A cohort may be cancelled
   * explicitly, but a cancelled cohort cannot be modified through
   * this general update operation.
   */
  async update(id: string, dto: UpdateCohortDto) {
    const cohort = await this.prisma.cohort.findUnique({
      where: {
        id,
      },
    });

    if (!cohort) {
      throw new NotFoundException('Cohort not found.');
    }

    if (cohort.status === CohortStatus.CANCELLED) {
      throw new BadRequestException('Cancelled cohorts cannot be modified.');
    }

    const name =
      dto.name !== undefined ? this.validateName(dto.name) : cohort.name;

    const programme =
      dto.programme !== undefined ? dto.programme : cohort.programme;

    this.validateProgramme(programme);

    const startDate =
      dto.startDate !== undefined ? new Date(dto.startDate) : cohort.startDate;

    const endDate =
      dto.endDate !== undefined ? new Date(dto.endDate) : cohort.endDate;

    this.validateDateRange(startDate, endDate);

    if (dto.fee !== undefined) {
      this.validateFee(dto.fee);
    }

    if (dto.name !== undefined || dto.programme !== undefined) {
      const duplicate = await this.prisma.cohort.findFirst({
        where: {
          id: {
            not: id,
          },
          name,
          programme,
        },
        select: {
          id: true,
        },
      });

      if (duplicate) {
        throw new ConflictException(
          'A cohort with this name already exists for this programme.',
        );
      }
    }

    /*
     * Prevent an administrator from accidentally setting a
     * non-cancelled cohort to an inconsistent lifecycle state.
     *
     * Date-derived lifecycle status remains authoritative.
     */
    if (dto.status !== undefined && dto.status === CohortStatus.CANCELLED) {
      return this.prisma.cohort.update({
        where: {
          id,
        },
        data: {
          ...(dto.name !== undefined && {
            name,
          }),
          ...(dto.programme !== undefined && {
            programme,
          }),
          ...(dto.description !== undefined && {
            description: dto.description.trim() || null,
          }),
          ...(dto.startDate !== undefined && {
            startDate,
          }),
          ...(dto.endDate !== undefined && {
            endDate,
          }),
          ...(dto.fee !== undefined && {
            fee: dto.fee,
          }),
          status: CohortStatus.CANCELLED,
        },
      });
    }

    /*
     * UPCOMING / ACTIVE / ENDED are calculated from dates.
     * We therefore do not persist a manually supplied lifecycle
     * status here.
     */
    return this.prisma.cohort.update({
      where: {
        id,
      },
      data: {
        ...(dto.name !== undefined && {
          name,
        }),
        ...(dto.programme !== undefined && {
          programme,
        }),
        ...(dto.description !== undefined && {
          description: dto.description.trim() || null,
        }),
        ...(dto.startDate !== undefined && {
          startDate,
        }),
        ...(dto.endDate !== undefined && {
          endDate,
        }),
        ...(dto.fee !== undefined && {
          fee: dto.fee,
        }),
      },
    });
  }

  /**
   * Cancel a cohort.
   *
   * Cancellation is a soft lifecycle action.
   * No students, payments, subscriptions or historical records
   * are deleted.
   */
  async cancel(id: string) {
    const cohort = await this.prisma.cohort.findUnique({
      where: {
        id,
      },
    });

    if (!cohort) {
      throw new NotFoundException('Cohort not found.');
    }

    if (cohort.status === CohortStatus.CANCELLED) {
      throw new BadRequestException('This cohort is already cancelled.');
    }

    return this.prisma.cohort.update({
      where: {
        id,
      },
      data: {
        status: CohortStatus.CANCELLED,
      },
    });
  }

  /**
   * Assign a student to a cohort.
   *
   * Assignment creates the StudentCohort membership only.
   * It does NOT mean the student has paid.
   *
   * Payment will later create the appropriate payment,
   * subscription and paid subject enrollments.
   */
  async assignStudent(id: string, dto: AssignStudentDto) {
    const cohort = await this.prisma.cohort.findUnique({
      where: {
        id,
      },
    });

    if (!cohort) {
      throw new NotFoundException('Cohort not found.');
    }

    const effectiveStatus = this.getEffectiveStatus(cohort);

    if (effectiveStatus === CohortStatus.CANCELLED) {
      throw new BadRequestException(
        'Students cannot be assigned to a cancelled cohort.',
      );
    }

    if (effectiveStatus === CohortStatus.ENDED) {
      throw new BadRequestException(
        'Students cannot be assigned to an ended cohort.',
      );
    }

    const student = await this.prisma.user.findUnique({
      where: {
        id: dto.userId,
      },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found.');
    }

    if (student.role !== 'STUDENT') {
      throw new BadRequestException(
        'Only users with the STUDENT role can be assigned to a cohort.',
      );
    }

    if (!student.isActive) {
      throw new BadRequestException('This student account is inactive.');
    }

    /*
     * A student can only be assigned to a cohort for a
     * programme they are actually registered for.
     */
    const programme = await this.prisma.studentProgramme.findUnique({
      where: {
        userId_programme: {
          userId: student.id,
          programme: cohort.programme,
        },
      },
      select: {
        id: true,
      },
    });

    if (!programme) {
      throw new BadRequestException(
        `This student is not registered for the ${cohort.programme} programme.`,
      );
    }

    const existing = await this.prisma.studentCohort.findUnique({
      where: {
        userId_cohortId: {
          userId: student.id,
          cohortId: cohort.id,
        },
      },
    });

    if (existing) {
      /*
       * WITHDRAWN and SUSPENDED memberships can be
       * reactivated by an administrator.
       */
      if (
        existing.status === StudentCohortStatus.WITHDRAWN ||
        existing.status === StudentCohortStatus.SUSPENDED
      ) {
        return this.prisma.studentCohort.update({
          where: {
            id: existing.id,
          },
          data: {
            status: StudentCohortStatus.ACTIVE,
            joinedAt: new Date(),
            completedAt: null,
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            cohort: true,
          },
        });
      }

      if (existing.status === StudentCohortStatus.COMPLETED) {
        throw new ConflictException(
          'This student has already completed this cohort.',
        );
      }

      throw new ConflictException(
        'This student is already assigned to this cohort.',
      );
    }

    return this.prisma.studentCohort.create({
      data: {
        userId: student.id,
        cohortId: cohort.id,
        status: StudentCohortStatus.ACTIVE,
        joinedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        cohort: true,
      },
    });
  }

  /**
   * Withdraw a student from a cohort.
   *
   * The StudentCohort membership is retained for historical
   * reporting. The User is never deleted.
   */
  async removeStudent(cohortId: string, studentId: string) {
    const membership = await this.prisma.studentCohort.findUnique({
      where: {
        userId_cohortId: {
          userId: studentId,
          cohortId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Student is not assigned to this cohort.');
    }

    if (membership.status === StudentCohortStatus.WITHDRAWN) {
      throw new BadRequestException(
        'This student has already been withdrawn from the cohort.',
      );
    }

    return this.prisma.studentCohort.update({
      where: {
        id: membership.id,
      },
      data: {
        status: StudentCohortStatus.WITHDRAWN,
      },
      include: {
        cohort: true,
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
  }

  /**
   * Return all cohort memberships belonging to a student.
   */
  async findMyCohorts(userId: string) {
    const memberships = await this.prisma.studentCohort.findMany({
      where: {
        userId,
      },
      include: {
        cohort: true,
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    return memberships.map((membership) => ({
      ...membership,
      cohort: {
        ...membership.cohort,
        effectiveStatus: this.getEffectiveStatus(membership.cohort),
      },
    }));
  }

  /**
   * Return current cohort memberships.
   *
   * Only ACTIVE memberships are considered current.
   * A cohort can be UPCOMING or ACTIVE.
   *
   * An ENDED cohort is never returned as current even if its
   * StudentCohort record still has ACTIVE status.
   */
  async findMyCurrentCohorts(userId: string) {
    const memberships = await this.prisma.studentCohort.findMany({
      where: {
        userId,
        status: StudentCohortStatus.ACTIVE,
      },
      include: {
        cohort: true,
      },
      orderBy: {
        cohort: {
          startDate: 'desc',
        },
      },
    });

    return memberships
      .map((membership) => ({
        ...membership,
        cohort: {
          ...membership.cohort,
          effectiveStatus: this.getEffectiveStatus(membership.cohort),
        },
      }))
      .filter(
        (membership) =>
          membership.cohort.effectiveStatus === CohortStatus.UPCOMING ||
          membership.cohort.effectiveStatus === CohortStatus.ACTIVE,
      );
  }
}
