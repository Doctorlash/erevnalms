import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  // =========================================================
  // GET USER NOTIFICATIONS
  // =========================================================

  @Get('user/:userId')
  getUserNotifications(@Param('userId') userId: string) {
    return this.service.findUserNotifications(userId);
  }

  // =========================================================
  // GET UNREAD COUNT
  // =========================================================

  @Get('user/:userId/unread')
  unreadCount(@Param('userId') userId: string) {
    return this.service.unreadCount(userId);
  }

  // =========================================================
  // MARK ONE AS READ
  // =========================================================

  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.service.markAsRead(id);
  }

  // =========================================================
  // MARK ALL AS READ
  // =========================================================

  @Patch('user/:userId/read-all')
  markAllAsRead(@Param('userId') userId: string) {
    return this.service.markAllAsRead(userId);
  }

  // =========================================================
  // CREATE NOTIFICATION
  // =========================================================

  @Post()
  createNotification(
    @Body()
    body: {
      userId: string;
      title: string;
      message: string;
    },
  ) {
    return this.service.createNotification(
      body.userId,
      body.title,
      body.message,
    );
  }

  // =========================================================
  // DELETE NOTIFICATION
  // =========================================================

  @Delete(':id')
  deleteNotification(@Param('id') id: string) {
    return this.service.deleteNotification(id);
  }
}
