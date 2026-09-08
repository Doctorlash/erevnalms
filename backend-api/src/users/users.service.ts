/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a user.
   */
  async create(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: any;
    isActive?: boolean;
  }) {
    return this.prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role: data.role ?? 'STUDENT',
        isActive: data.isActive ?? true,
      },
    });
  }

  /**
   * Find user by email.
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
   * Get all users.
   */
  async findAll() {
    return this.prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get all teachers.
   */
  async getTeachers() {
    return this.prisma.user.findMany({
      where: {
        role: 'TEACHER',
      },
    });
  }

  /**
   * Get all students.
   */
  async getStudents() {
    return this.prisma.user.findMany({
      where: {
        role: 'STUDENT',
      },
    });
  }

  /**
   * Update user role.
   */
  async updateRole(id: string, role: any) {
    return this.prisma.user.update({
      where: {
        id,
      },
      data: {
        role,
      },
    });
  }

  /**
   * Deactivate user.
   */
  async deactivate(id: string) {
    return this.prisma.user.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * Activate user.
   */
  async activate(id: string) {
    return this.prisma.user.update({
      where: {
        id,
      },
      data: {
        isActive: true,
      },
    });
  }

  /**
   * Get platform user statistics.
   */
  async getStats() {
    const totalUsers = await this.prisma.user.count();

    const teachers = await this.prisma.user.count({
      where: {
        role: 'TEACHER',
      },
    });

    const students = await this.prisma.user.count({
      where: {
        role: 'STUDENT',
      },
    });

    const admins = await this.prisma.user.count({
      where: {
        role: 'ADMIN',
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
      } as any,
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
   * Expose the Prisma service to application services
   * that need to perform a transaction involving users
   * and other related records.
   *
   * This keeps Prisma access inside UsersService instead
   * of using private-property hacks such as:
   *
   * this.usersService['prisma']
   */
  getPrisma() {
    return this.prisma;
  }
}
