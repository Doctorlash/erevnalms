import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

import { EnrollmentType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from './cloudinary.service';

@Injectable()
export class ResourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  /**
   * ============================================================
   * VALIDATE RESOURCE FILE
   * ============================================================
   *
   * The frontend is not trusted.
   *
   * The teacher may send:
   *
   * type = PDF
   * file = MP3
   *
   * Therefore the backend checks the actual MIME type before
   * uploading anything to Cloudinary.
   */
  private validateResourceFile(
    file: Express.Multer.File,
    resourceType: 'PDF' | 'VIDEO' | 'AUDIO',
  ) {
    if (!file) {
      throw new BadRequestException('Resource file is required.');
    }

    const mimeType = file.mimetype.toLowerCase();

    if (resourceType === 'PDF') {
      if (mimeType !== 'application/pdf') {
        throw new BadRequestException(
          'The selected PDF resource must be a valid PDF file.',
        );
      }

      return;
    }

    if (resourceType === 'VIDEO') {
      if (!mimeType.startsWith('video/')) {
        throw new BadRequestException(
          'The selected video resource must be a video file.',
        );
      }

      return;
    }

    if (resourceType === 'AUDIO') {
      if (!mimeType.startsWith('audio/')) {
        throw new BadRequestException(
          'The selected audio resource must be an audio file.',
        );
      }

      return;
    }

    throw new BadRequestException('Invalid resource type.');
  }

  /**
   * ============================================================
   * STUDENT RESOURCE ACCESS
   * ============================================================
   */
  private async ensureStudentSubjectAccess(userId: string, subjectId: string) {
    const now = new Date();

    const student = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student account not found.');
    }

    if (student.role !== 'STUDENT') {
      throw new ForbiddenException(
        'Only students can use student resource access.',
      );
    }

    if (!student.isActive) {
      throw new ForbiddenException('Your student account is inactive.');
    }

    const subject = await this.prisma.subject.findUnique({
      where: {
        id: subjectId,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found.');
    }

    if (!subject.isActive) {
      throw new ForbiddenException('This subject is currently inactive.');
    }

    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId,
        subjectId,

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

      select: {
        id: true,
        type: true,
        enrolledAt: true,
        expiresAt: true,
      },
    });

    if (!enrollment) {
      throw new ForbiddenException(
        'You do not have active access to this subject.',
      );
    }

    return enrollment;
  }

  /**
   * ============================================================
   * CREATE RESOURCE
   * ============================================================
   */
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
    if (!data.title?.trim()) {
      throw new BadRequestException('Resource title is required.');
    }

    if (!data.subjectId?.trim()) {
      throw new BadRequestException('Subject ID is required.');
    }

    const subject = await this.prisma.subject.findUnique({
      where: {
        id: data.subjectId,
      },
      select: {
        id: true,
        name: true,
        programme: true,
        isActive: true,
        teacherId: true,
      },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found.');
    }

    if (!subject.isActive) {
      throw new BadRequestException(
        'This subject is inactive and cannot receive resources.',
      );
    }

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
      throw new NotFoundException('Teacher not found.');
    }

    if (teacher.role !== 'TEACHER' && teacher.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Only teachers and administrators can upload resources.',
      );
    }

    if (!teacher.isActive) {
      throw new ForbiddenException('This account is inactive.');
    }

    /**
     * Teachers may only upload to subjects assigned to them.
     * Admins may upload to any active subject.
     */
    if (teacher.role === 'TEACHER' && subject.teacherId !== teacherId) {
      throw new ForbiddenException('You are not assigned to this subject.');
    }

    /**
     * ----------------------------------------------------------
     * FILE VALIDATION
     * ----------------------------------------------------------
     */
    this.validateResourceFile(file, data.type);

    /**
     * ----------------------------------------------------------
     * CLOUDINARY RESOURCE TYPE
     * ----------------------------------------------------------
     *
     * PDF   -> image
     * VIDEO -> video
     * AUDIO -> video
     */
    let cloudinaryResourceType: 'image' | 'video' | 'raw';

    switch (data.type) {
      case 'PDF':
        cloudinaryResourceType = 'image';
        break;

      case 'VIDEO':
      case 'AUDIO':
        cloudinaryResourceType = 'video';
        break;

      default:
        cloudinaryResourceType = 'raw';
    }

    const uploaded = await this.cloudinary.uploadFile(
      file,
      cloudinaryResourceType,
    );

    return this.prisma.resource.create({
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || undefined,
        type: data.type,
        fileUrl: uploaded.secure_url,
        fileName: file.originalname,
        fileSize: uploaded.bytes,
        publicId: uploaded.public_id,
        subjectId: data.subjectId,
        teacherId,
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

  /**
   * ============================================================
   * GET RESOURCES
   * ============================================================
   */
  async findAll(userId: string, userRole: string) {
    if (userRole === 'STUDENT') {
      const now = new Date();

      return this.prisma.resource.findMany({
        where: {
          subject: {
            isActive: true,

            enrollments: {
              some: {
                userId,

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
            },
          },
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

  /**
   * ============================================================
   * GET RESOURCES BY SUBJECT
   * ============================================================
   */
  async findBySubject(subjectId: string, userId: string, userRole: string) {
    const subject = await this.prisma.subject.findUnique({
      where: {
        id: subjectId,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found.');
    }

    if (userRole === 'STUDENT') {
      await this.ensureStudentSubjectAccess(userId, subjectId);
    }

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

  /**
   * ============================================================
   * GET TEACHER'S RESOURCES
   * ============================================================
   */
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

  /**
   * ============================================================
   * GET SINGLE RESOURCE
   * ============================================================
   */
  async findOne(id: string, userId: string, userRole: string) {
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
      throw new NotFoundException('Resource not found.');
    }

    if (userRole === 'STUDENT') {
      await this.ensureStudentSubjectAccess(userId, resource.subjectId);
    }

    return resource;
  }

  /**
   * ============================================================
   * DELETE RESOURCE
   * ============================================================
   */
  async delete(id: string, userId: string, userRole: string) {
    const resource = await this.prisma.resource.findUnique({
      where: {
        id,
      },
    });

    if (!resource) {
      throw new NotFoundException('Resource not found.');
    }

    if (userRole !== 'ADMIN' && resource.teacherId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to delete this resource.',
      );
    }

    if (resource.publicId) {
      let cloudinaryResourceType: 'image' | 'video' | 'raw';

      switch (resource.type) {
        case 'PDF':
          cloudinaryResourceType = 'image';
          break;

        case 'VIDEO':
        case 'AUDIO':
          cloudinaryResourceType = 'video';
          break;

        default:
          cloudinaryResourceType = 'raw';
      }

      await this.cloudinary.deleteFile(
        resource.publicId,
        cloudinaryResourceType,
      );
    }

    return this.prisma.resource.delete({
      where: {
        id,
      },
    });
  }
}
