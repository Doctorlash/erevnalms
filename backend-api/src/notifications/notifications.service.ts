import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // =========================================================
  // GET USER NOTIFICATIONS
  // =========================================================

  async findUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // =========================================================
  // GET UNREAD COUNT
  // =========================================================

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return {
      unread: count,
    };
  }

  // =========================================================
  // MARK ONE AS READ
  // =========================================================

  async markAsRead(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: {
        id,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: {
        id,
      },
      data: {
        isRead: true,
      },
    });
  }

  // =========================================================
  // MARK ALL AS READ
  // =========================================================

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return {
      success: true,
      message: 'All notifications marked as read',
    };
  }

  // =========================================================
  // CREATE NOTIFICATION
  // =========================================================

  async createNotification(userId: string, title: string, message: string) {
    return this.prisma.notification.create({
      data: {
        userId,
        title,
        message,
      },
    });
  }

  // =========================================================
  // DELETE NOTIFICATION
  // =========================================================

  async deleteNotification(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: {
        id,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
      message: 'Notification deleted',
    };
  }
}
