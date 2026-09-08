import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { MessagesService } from './messages.service';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly service: MessagesService) {}

  /**
   * ============================================================
   * CREATE CONVERSATION
   * ============================================================
   *
   * The authenticated user must be one of the participants.
   * The service also verifies that the two users are permitted
   * to communicate based on the existing messaging relationship.
   */
  @Post('conversation')
  createConversation(
    @Req() req: any,
    @Body()
    body: {
      participantOneId: string;
      participantTwoId: string;
    },
  ) {
    return this.service.createConversation(
      req.user.id,
      body.participantOneId,
      body.participantTwoId,
    );
  }

  /**
   * ============================================================
   * START STUDENT -> TEACHER CONVERSATION
   * ============================================================
   *
   * The student ID is taken from JWT.
   * A client cannot start a conversation pretending to be
   * another student.
   */
  @Post('start')
  startConversation(
    @Req() req: any,
    @Body()
    body: {
      teacherId: string;
    },
  ) {
    return this.service.startConversation(req.user.id, body.teacherId);
  }

  /**
   * ============================================================
   * SEND MESSAGE
   * ============================================================
   *
   * senderId is deliberately NOT accepted from the client.
   */
  @Post('send')
  send(
    @Req() req: any,
    @Body()
    body: {
      conversationId: string;
      content?: string;
      fileUrl?: string;
      fileName?: string;
      fileType?: string;
      fileSize?: number;
    },
  ) {
    return this.service.sendMessage(
      body.conversationId,
      req.user.id,
      body.content ?? '',
      body.fileUrl,
      body.fileName,
      body.fileType,
      body.fileSize,
    );
  }

  /**
   * ============================================================
   * SINGLE CONVERSATION
   * ============================================================
   */
  @Get('conversation/:id')
  conversation(@Req() req: any, @Param('id') id: string) {
    return this.service.getConversation(id, req.user.id);
  }

  /**
   * ============================================================
   * USER CONVERSATIONS
   * ============================================================
   *
   * userId is taken from JWT rather than URL.
   */
  @Get('user')
  userConversations(@Req() req: any) {
    return this.service.getUserConversations(req.user.id);
  }

  /**
   * ============================================================
   * SEARCH CONVERSATIONS
   * ============================================================
   */
  @Get('search/:search')
  searchConversations(@Req() req: any, @Param('search') search: string) {
    return this.service.searchConversations(req.user.id, search);
  }

  /**
   * ============================================================
   * TEACHER INBOX
   * ============================================================
   *
   * The teacher identity comes from JWT.
   */
  @Get('teacher')
  teacherInbox(@Req() req: any) {
    return this.service.teacherInbox(req.user.id);
  }

  /**
   * ============================================================
   * TEACHERS
   * ============================================================
   */
  @Get('teachers')
  teachers() {
    return this.service.getTeachers();
  }

  /**
   * ============================================================
   * MESSAGE CONTACTS
   * ============================================================
   */
  @Get('contacts')
  messageContacts(@Req() req: any) {
    return this.service.getMessageContacts(req.user.id);
  }

  /**
   * ============================================================
   * MARK AS READ
   * ============================================================
   *
   * The reader is always the authenticated user.
   */
  @Patch(':messageId/read')
  markAsRead(@Req() req: any, @Param('messageId') messageId: string) {
    return this.service.markAsRead(messageId, req.user.id);
  }

  /**
   * ============================================================
   * UNREAD COUNT
   * ============================================================
   */
  @Get('unread')
  unreadCount(@Req() req: any) {
    return this.service.unreadCount(req.user.id);
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
  upload(@UploadedFile() file: Express.Multer.File) {
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
   *
   * userId is deliberately NOT accepted from the client.
   */
  @Post('reaction')
  reaction(
    @Req() req: any,
    @Body()
    body: {
      messageId: string;
      emoji: string;
    },
  ) {
    return this.service.toggleReaction(body.messageId, req.user.id, body.emoji);
  }
}
