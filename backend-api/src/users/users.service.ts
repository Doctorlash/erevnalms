/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
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
  async findAll() {
    return this.prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getTeachers() {
    return this.prisma.user.findMany({
      where: {
        role: 'TEACHER',
      },
    });
  }

  async getStudents() {
    return this.prisma.user.findMany({
      where: {
        role: 'STUDENT',
      },
    });
  }

  async updateRole(id: string, role: any) {
    return this.prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  async deactivate(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  async activate(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        isActive: true,
      },
    });
  }

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
  async findByResetPasswordToken(token: string) {
    return this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
      } as any,
    });
  }

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
}
