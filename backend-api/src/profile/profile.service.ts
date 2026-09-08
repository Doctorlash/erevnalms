import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';
import { v2 as cloudinary } from 'cloudinary';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
    }
  }

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
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isActive) {
      throw new BadRequestException('Your account is inactive');
    }

    const cleanedData: Record<string, string> = {};

    if (data.firstName !== undefined) {
      const value = data.firstName.trim();

      if (value.length < 2) {
        throw new BadRequestException(
          'First name must be at least 2 characters',
        );
      }

      cleanedData.firstName = value;
    }

    if (data.lastName !== undefined) {
      const value = data.lastName.trim();

      if (value.length < 2) {
        throw new BadRequestException(
          'Last name must be at least 2 characters',
        );
      }

      cleanedData.lastName = value;
    }

    if (data.phone !== undefined) {
      cleanedData.phone = data.phone.trim();
    }

    if (data.school !== undefined) {
      cleanedData.school = data.school.trim();
    }

    if (data.classLevel !== undefined) {
      cleanedData.classLevel = data.classLevel.trim();
    }

    if (data.bio !== undefined) {
      cleanedData.bio = data.bio.trim();
    }

    if (data.profileImage !== undefined) {
      cleanedData.profileImage = data.profileImage.trim();
    }

    return this.prisma.user.update({
      where: {
        id,
      },
      data: cleanedData,
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
  }

  async updateAvatar(id: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        isActive: true,
        profileImage: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isActive) {
      throw new BadRequestException('Your account is inactive');
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new BadRequestException(
        'Profile image storage is not configured on the server',
      );
    }

    const uploadResult = await new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'erevna/profile',
          resource_type: 'image',
          transformation: [
            {
              width: 500,
              height: 500,
              crop: 'fill',
              gravity: 'face',
            },
            {
              quality: 'auto',
              fetch_format: 'auto',
            },
          ],
        },
        (error, result) => {
          if (error || !result) {
            reject(
              error instanceof Error
                ? error
                : new Error('Cloudinary upload failed'),
            );
            return;
          }

          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        },
      );

      uploadStream.end(file.buffer);
    });

    const updatedUser = await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        profileImage: uploadResult.secure_url,
      },
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

    return updatedUser;
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

    if (!user.isActive) {
      throw new BadRequestException('Your account is inactive');
    }

    const matches = await bcrypt.compare(oldPassword, user.password);

    if (!matches) {
      throw new BadRequestException('Current password is incorrect');
    }

    const samePassword = await bcrypt.compare(newPassword, user.password);

    if (samePassword) {
      throw new ConflictException(
        'New password must be different from your current password',
      );
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        password: hashed,
      },
    });

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }
}
