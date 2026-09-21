import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Fields that are safe for administrative user-management screens.
   *
   * Never expose password hashes or password-reset tokens to the frontend.
   */
  private readonly safeUserSelect = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    role: true,
    isActive: true,
    phone: true,
    school: true,
    classLevel: true,
    bio: true,
    profileImage: true,
    isOnline: true,
    lastSeen: true,
    createdAt: true,
    updatedAt: true,
  };

  /**
   * Create a user.
   */
  async create(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: Role;
    isActive?: boolean;
  }) {
    return this.prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role: data.role ?? Role.STUDENT,
        isActive: data.isActive ?? true,
      },
      select: this.safeUserSelect,
    });
  }

  /**
   * Find user by email.
   *
   * This method is intentionally allowed to return the password because
   * authentication services may need it to validate login credentials.
   *
   * Do not use this method as an API response directly.
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  /**
   * Find user by ID.
   *
   * Returns the full record because internal authentication/profile
   * operations may require fields that should not be exposed through
   * administrative list endpoints.
   */
  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
    });
  }

  /**
   * Update authenticated user's profile.
   */
  async updateProfile(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      school?: string;
      classLevel?: string;
      bio?: string;
      profileImage?: string;
    },
  ) {
    return this.prisma.user.update({
      where: {
        id,
      },
      data,
    });
  }

  /**
   * Update user's password.
   */
  async updatePassword(id: string, hashedPassword: string) {
    return this.prisma.user.update({
      where: {
        id,
      },
      data: {
        password: hashedPassword,
      },
    });
  }

  /**
   * Get all users for the Admin Users page.
   *
   * Sensitive authentication fields are deliberately excluded.
   */
  async findAll() {
    return this.prisma.user.findMany({
      select: this.safeUserSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get all teachers for the Admin Teachers page.
   *
   * Sensitive authentication fields are deliberately excluded.
   */
  async getTeachers() {
    return this.prisma.user.findMany({
      where: {
        role: Role.TEACHER,
      },
      select: this.safeUserSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get all students with the information required for
   * administrative student management.
   *
   * This provides the relationship:
   *
   * Student
   *   -> Programme
   *   -> Cohort membership
   *   -> Cohort
   *   -> Subject enrollment
   *   -> Subject requests
   *   -> Subscription
   *   -> Payment
   *
   * Sensitive authentication/payment gateway fields are excluded.
   */
  async getStudents() {
    const students = await this.prisma.user.findMany({
      where: {
        role: Role.STUDENT,
      },
      select: {
        ...this.safeUserSelect,

        studentProgrammes: {
          select: {
            id: true,
            programme: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },

        enrollments: {
          select: {
            id: true,
            subjectId: true,
            programme: true,
            type: true,
            enrolledAt: true,
            expiresAt: true,
            cohortId: true,
            studentCohortId: true,
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
        },

        subjectRequests: {
          select: {
            id: true,
            subjectId: true,
            programme: true,
            status: true,
            rejectionReason: true,
            requestedAt: true,
            reviewedAt: true,
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
            requestedAt: 'desc',
          },
        },

        subscriptions: {
          select: {
            id: true,
            plan: true,
            billingType: true,
            status: true,
            startDate: true,
            endDate: true,
            paymentReference: true,
            cohortId: true,
            studentCohortId: true,
            amount: true,
            currency: true,
            createdAt: true,
            updatedAt: true,
            cohort: {
              select: {
                id: true,
                name: true,
                programme: true,
                startDate: true,
                endDate: true,
                fee: true,
                status: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },

        payments: {
          select: {
            id: true,
            cohortId: true,
            studentCohortId: true,
            subscriptionId: true,
            amount: true,
            currency: true,
            status: true,
            paymentReference: true,
            paymentMethod: true,
            paidAt: true,
            createdAt: true,
            updatedAt: true,
            provider: true,
            providerTransactionId: true,
            cohort: {
              select: {
                id: true,
                name: true,
                programme: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return students;
  }

  /**
   * Update user role.
   *
   * Only the three roles supported by Erevna are accepted.
   */
  async updateRole(id: string, role: string) {
    const normalizedRole = role.trim().toUpperCase();

    if (
      normalizedRole !== Role.ADMIN &&
      normalizedRole !== Role.TEACHER &&
      normalizedRole !== Role.STUDENT
    ) {
      throw new BadRequestException(
        'Invalid role. Role must be ADMIN, TEACHER, or STUDENT.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return this.prisma.user.update({
      where: {
        id,
      },
      data: {
        role: normalizedRole as Role,
      },
      select: this.safeUserSelect,
    });
  }

  /**
   * Deactivate user.
   */
  async deactivate(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (user.role === Role.ADMIN) {
      throw new ConflictException(
        'Administrator accounts cannot be deactivated from this interface.',
      );
    }

    if (!user.isActive) {
      return this.prisma.user.findUnique({
        where: {
          id,
        },
        select: this.safeUserSelect,
      });
    }

    return this.prisma.user.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
      select: this.safeUserSelect,
    });
  }

  /**
   * Activate user.
   */
  async activate(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return this.prisma.user.update({
      where: {
        id,
      },
      data: {
        isActive: true,
      },
      select: this.safeUserSelect,
    });
  }

  /**
   * Get platform user statistics.
   */
  async getStats() {
    const totalUsers = await this.prisma.user.count();

    const teachers = await this.prisma.user.count({
      where: {
        role: Role.TEACHER,
      },
    });

    const students = await this.prisma.user.count({
      where: {
        role: Role.STUDENT,
      },
    });

    const admins = await this.prisma.user.count({
      where: {
        role: Role.ADMIN,
      },
    });

    return {
      totalUsers,
      teachers,
      students,
      admins,
    };
  }

  /**
   * Store a password reset token.
   */
  async setPasswordResetToken(userId: string, token: string, expires: Date) {
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expires,
      },
    });
  }

  /**
   * Find a user using a password reset token.
   */
  async findByResetPasswordToken(token: string) {
    return this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
      },
    });
  }

  /**
   * Clear password reset information.
   */
  async clearPasswordResetToken(userId: string) {
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });
  }

  /**
   * Expose Prisma for application services that need
   * transactions involving users and other records.
   */
  getPrisma() {
    return this.prisma;
  }
}
