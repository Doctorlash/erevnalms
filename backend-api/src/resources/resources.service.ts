import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from './cloudinary.service';

@Injectable()
export class ResourcesService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  async create(
    data: {
      title: string;
      description?: string;
      type: 'PDF' | 'VIDEO' | 'AUDIO';
      subjectId: string;
    },
    file: Express.Multer.File,
    teacherId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Resource file is required');
    }

    const subject = await this.prisma.subject.findUnique({
      where: {
        id: data.subjectId,
      },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    const teacher = await this.prisma.user.findUnique({
      where: {
        id: teacherId,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    let resourceType: 'image' | 'video' | 'raw';

    if (data.type === 'VIDEO') {
      resourceType = 'video';
    } else {
      resourceType = 'raw';
    }

    const uploaded = await this.cloudinary.uploadFile(file, resourceType);

    return this.prisma.resource.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        fileUrl: uploaded.secure_url,
        fileName: file.originalname,
        fileSize: uploaded.bytes,
        publicId: uploaded.public_id,
        subjectId: data.subjectId,
        teacherId: teacherId,
      },
      include: {
        subject: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.resource.findMany({
      include: {
        subject: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findBySubject(subjectId: string) {
    return this.prisma.resource.findMany({
      where: {
        subjectId,
      },
      include: {
        subject: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByTeacher(teacherId: string) {
    return this.prisma.resource.findMany({
      where: {
        teacherId,
      },
      include: {
        subject: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const resource = await this.prisma.resource.findUnique({
      where: {
        id,
      },
      include: {
        subject: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    return resource;
  }

  async delete(id: string, userId: string, userRole: string) {
    const resource = await this.prisma.resource.findUnique({
      where: {
        id,
      },
    });

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    if (userRole !== 'ADMIN' && resource.teacherId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to delete this resource',
      );
    }

    if (resource.publicId) {
      let resourceType: 'image' | 'video' | 'raw' = 'raw';

      if (resource.type === 'VIDEO') {
        resourceType = 'video';
      }

      await this.cloudinary.deleteFile(resource.publicId, resourceType);
    }

    return this.prisma.resource.delete({
      where: {
        id,
      },
    });
  }
}
