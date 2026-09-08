import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateContactDto } from './dto/create-contact.dto';
import { CreateSupportDto } from './dto/create-support.dto';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * PUBLIC CONTACT FORM
   *
   * Creates a normal contact message from the landing page.
   */
  async create(dto: CreateContactDto) {
    return this.prisma.contactMessage.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone?.trim() || null,
        subject: dto.subject.trim(),
        message: dto.message.trim(),
        type: 'CONTACT',
      },
    });
  }

  /**
   * STUDENT SUPPORT
   *
   * The user ID is supplied by the authenticated backend request,
   * never by the frontend.
   */
  async createSupport(userId: string, dto: CreateSupportDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'STUDENT') {
      throw new NotFoundException('Student account not found');
    }

    if (!user.isActive) {
      throw new NotFoundException('Student account is inactive');
    }

    return this.prisma.contactMessage.create({
      data: {
        userId: user.id,
        type: 'SUPPORT',
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        phone: dto.phone?.trim() || user.phone || null,
        subject: dto.subject.trim(),
        message: dto.message.trim(),
      },
    });
  }

  /**
   * ADMIN
   *
   * Get all contact messages and support requests.
   */
  async findAll() {
    return this.prisma.contactMessage.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
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
  }

  /**
   * ADMIN
   *
   * Get one contact message/support request.
   */
  async findOne(id: string) {
    const message = await this.prisma.contactMessage.findUnique({
      where: {
        id,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Contact message not found');
    }

    return message;
  }

  /**
   * ADMIN
   *
   * Update message status.
   */
  async updateStatus(id: string, status: 'UNREAD' | 'READ' | 'RESOLVED') {
    const message = await this.prisma.contactMessage.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Contact message not found');
    }

    return this.prisma.contactMessage.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });
  }

  /**
   * ADMIN
   *
   * Delete a contact message/support request.
   */
  async remove(id: string) {
    const message = await this.prisma.contactMessage.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Contact message not found');
    }

    return this.prisma.contactMessage.delete({
      where: {
        id,
      },
    });
  }
}
