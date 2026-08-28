import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },

      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        school: true,
        classLevel: true,
        bio: true,
        role: true,
        profileImage: true,
        createdAt: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
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

  async updateAvatar(id: string, profileImage: string) {
    return this.prisma.user.update({
      where: {
        id,
      },
      data: {
        profileImage,
      },
    });
  }

  async changePassword(id: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const matches = await bcrypt.compare(oldPassword, user.password);

    if (!matches) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    return this.prisma.user.update({
      where: {
        id,
      },
      data: {
        password: hashed,
      },
    });
  }
}
