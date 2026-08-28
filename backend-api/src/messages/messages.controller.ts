import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly service: MessagesService) {}

  /**
   * ============================================================
   * CREATE CONVERSATION
   * ============================================================
   */

  @Post('conversation')
  createConversation(
    @Body()
    body: {
      participantOneId: string;
      participantTwoId: string;
    },
  ) {
    return this.service.createConversation(
      body.participantOneId,
      body.participantTwoId,
    );
  }

  /**
   * ============================================================
   * START STUDENT -> TEACHER CONVERSATION
   * ============================================================
   */

  @Post('start')
  startConversation(
    @Body()
    body: {
      studentId: string;
      teacherId: string;
    },
  ) {
    return this.service.startConversation(body.studentId, body.teacherId);
  }

  /**
   * ============================================================
   * SEND MESSAGE
   * ============================================================
   */

  @Post('send')
  send(
    @Body()
    body: {
      conversationId: string;
      senderId: string;
      content?: string;
      fileUrl?: string;
      fileName?: string;
      fileType?: string;
      fileSize?: number;
    },
  ) {
    return this.service.sendMessage(
      body.conversationId,
      body.senderId,
      body.content ?? '',
      body.fileUrl,
      body.fileName,
      body.fileType,
      body.fileSize,
    );
  }

  /**
   * ============================================================
   * GET CONVERSATION
   * ============================================================
   */

  @Get('conversation/:id')
  conversation(@Param('id') id: string) {
    return this.service.getConversation(id);
  }

  /**
   * ============================================================
   * MESSAGE CONTACTS
   * ============================================================
   */

  @Get('contacts/:userId')
  messageContacts(@Param('userId') userId: string) {
    return this.service.getMessageContacts(userId);
  }

  /**
   * ============================================================
   * GET USER CONVERSATIONS
   * ============================================================
   */

  @Get('user/:userId')
  userConversations(@Param('userId') userId: string) {
    return this.service.getUserConversations(userId);
  }

  /**
   * ============================================================
   * SEARCH USER CONVERSATIONS
   * ============================================================
   */

  @Get('search/:userId/:search')
  searchConversations(
    @Param('userId') userId: string,
    @Param('search') search: string,
  ) {
    return this.service.searchConversations(userId, search);
  }

  /**
   * ============================================================
   * TEACHER INBOX
   * ============================================================
   */

  @Get('teacher/:teacherId')
  teacherInbox(@Param('teacherId') teacherId: string) {
    return this.service.teacherInbox(teacherId);
  }

  /**
   * ============================================================
   * GET ALL TEACHERS
   * ============================================================
   */

  @Get('teachers')
  teachers() {
    return this.service.getTeachers();
  }

  /**
   * ============================================================
   * MARK MESSAGE AS READ
   * ============================================================
   */

  @Patch(':messageId/read')
  markAsRead(
    @Param('messageId') messageId: string,
    @Body()
    body?: {
      userId?: string;
    },
  ) {
    return this.service.markAsRead(messageId, body?.userId);
  }

  /**
   * ============================================================
   * UNREAD MESSAGE COUNT
   * ============================================================
   */

  @Get('user/:userId/unread')
  unreadCount(@Param('userId') userId: string) {
    return this.service.unreadCount(userId);
  }

  /**
   * ============================================================
   * FILE UPLOAD
   * ============================================================
   */

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      dest: 'uploads',
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  upload(
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    if (!file) {
      return {
        success: false,
        message: 'No file uploaded.',
      };
    }

    return {
      success: true,
      url: `/uploads/${file.filename}`,
      name: file.originalname,
      type: file.mimetype,
      size: file.size,
    };
  }

  /**
   * ============================================================
   * MESSAGE REACTION
   * ============================================================
   */

  @Post('reaction')
  reaction(
    @Body()
    body: {
      messageId: string;
      userId: string;
      emoji: string;
    },
  ) {
    return this.service.toggleReaction(body.messageId, body.userId, body.emoji);
  }
}
