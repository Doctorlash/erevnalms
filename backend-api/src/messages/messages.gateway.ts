/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { Server, Socket } from 'socket.io';

import { PrismaService } from '../prisma/prisma.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

interface JwtPayload {
  sub: string;
  email?: string;
  role?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  /**
   * socketId -> authenticated userId
   */
  private connectedUsers = new Map<string, string>();

  /**
   * userId -> Set of socketIds
   *
   * A user can have more than one browser/tab/device connected.
   */
  private userSockets = new Map<string, Set<string>>();

  /**
   * userId -> last seen
   */
  private lastSeen = new Map<string, Date>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * ============================================================
   * AUTHENTICATION
   * ============================================================
   */

  private extractToken(client: Socket): string | null {
    /**
     * Preferred Socket.IO format:
     *
     * io(url, {
     *   auth: {
     *     token: 'JWT'
     *   }
     * })
     */
    const authToken = client.handshake.auth?.token;

    if (typeof authToken === 'string' && authToken.trim()) {
      return authToken.replace(/^Bearer\s+/i, '').trim();
    }

    /**
     * Also support:
     *
     * extraHeaders:
     * {
     *   Authorization: 'Bearer JWT'
     * }
     */
    const authorization = client.handshake.headers?.authorization;

    if (typeof authorization === 'string' && authorization.trim()) {
      return authorization.replace(/^Bearer\s+/i, '').trim();
    }

    return null;
  }

  private async authenticateSocket(
    client: AuthenticatedSocket,
  ): Promise<string | null> {
    const token = this.extractToken(client);

    if (!token) {
      return null;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      if (!payload?.sub) {
        return null;
      }

      const user = await this.prisma.user.findUnique({
        where: {
          id: payload.sub,
        },
        select: {
          id: true,
          isActive: true,
          role: true,
        },
      });

      if (!user || !user.isActive) {
        return null;
      }

      client.userId = user.id;

      return user.id;
    } catch {
      return null;
    }
  }

  /**
   * ============================================================
   * CONNECTION
   * ============================================================
   */

  async handleConnection(client: AuthenticatedSocket) {
    const userId = await this.authenticateSocket(client);

    if (!userId) {
      console.warn(`Rejected unauthenticated socket: ${client.id}`);

      client.emit('authenticationError', {
        success: false,
        message: 'Authentication required.',
      });

      client.disconnect(true);

      return;
    }

    this.connectedUsers.set(client.id, userId);

    let sockets = this.userSockets.get(userId);

    const wasOffline = !sockets || sockets.size === 0;

    if (!sockets) {
      sockets = new Set<string>();
      this.userSockets.set(userId, sockets);
    }

    sockets.add(client.id);

    if (wasOffline) {
      this.lastSeen.delete(userId);

      this.server.emit('userOnline', {
        userId,
      });
    }

    console.log(`Socket authenticated: ${client.id} (user: ${userId})`);
  }

  /**
   * ============================================================
   * DISCONNECTION
   * ============================================================
   */

  handleDisconnect(client: AuthenticatedSocket) {
    const userId = this.connectedUsers.get(client.id);

    if (!userId) {
      console.log(`Socket disconnected: ${client.id}`);
      return;
    }

    this.connectedUsers.delete(client.id);

    const sockets = this.userSockets.get(userId);

    if (sockets) {
      sockets.delete(client.id);

      /**
       * Only consider the user offline when their LAST
       * connected socket has disconnected.
       */
      if (sockets.size === 0) {
        this.userSockets.delete(userId);

        const lastSeen = new Date();

        this.lastSeen.set(userId, lastSeen);

        this.server.emit('userOffline', {
          userId,
          lastSeen,
        });
      }
    }

    console.log(`Socket disconnected: ${client.id} (user: ${userId})`);
  }

  /**
   * ============================================================
   * AUTHENTICATED USER
   * ============================================================
   */

  private getAuthenticatedUser(client: AuthenticatedSocket): string | null {
    return this.connectedUsers.get(client.id) || null;
  }

  /**
   * ============================================================
   * CONVERSATION MEMBERSHIP
   * ============================================================
   */

  private async isConversationParticipant(
    conversationId: string,
    userId: string,
  ): Promise<boolean> {
    const conversation = await this.prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
      select: {
        participantOneId: true,
        participantTwoId: true,
      },
    });

    if (!conversation) {
      return false;
    }

    return (
      conversation.participantOneId === userId ||
      conversation.participantTwoId === userId
    );
  }

  /**
   * ============================================================
   * REGISTER USER
   * ============================================================
   *
   * Kept for compatibility with the existing frontend.
   *
   * IMPORTANT:
   * The client-provided userId is ignored.
   * The identity comes from the authenticated JWT.
   */
  @SubscribeMessage('register')
  registerUser(
    @MessageBody() _requestedUserId: string,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const userId = this.getAuthenticatedUser(client);

    if (!userId) {
      return {
        success: false,
        message: 'Socket is not authenticated.',
      };
    }

    return {
      success: true,
      userId,
    };
  }

  /**
   * ============================================================
   * ONLINE USERS
   * ============================================================
   */

  @SubscribeMessage('onlineUsers')
  getOnlineUsers(@ConnectedSocket() client: AuthenticatedSocket) {
    const userId = this.getAuthenticatedUser(client);

    if (!userId) {
      return {
        success: false,
        message: 'Socket is not authenticated.',
      };
    }

    return {
      users: [...this.userSockets.keys()],
    };
  }

  /**
   * ============================================================
   * JOIN CONVERSATION ROOM
   * ============================================================
   */

  @SubscribeMessage('join')
  async handleJoin(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const userId = this.getAuthenticatedUser(client);

    if (!userId) {
      return {
        success: false,
        message: 'Socket is not authenticated.',
      };
    }

    if (!conversationId) {
      return {
        success: false,
        message: 'Conversation ID is required.',
      };
    }

    const isParticipant = await this.isConversationParticipant(
      conversationId,
      userId,
    );

    if (!isParticipant) {
      return {
        success: false,
        message: 'You are not a participant in this conversation.',
      };
    }

    await client.join(conversationId);

    return {
      success: true,
      conversationId,
    };
  }

  /**
   * ============================================================
   * LEAVE CONVERSATION ROOM
   * ============================================================
   */

  @SubscribeMessage('leave')
  async handleLeave(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const userId = this.getAuthenticatedUser(client);

    if (!userId) {
      return {
        success: false,
        message: 'Socket is not authenticated.',
      };
    }

    if (!conversationId) {
      return {
        success: false,
        message: 'Conversation ID is required.',
      };
    }

    const isParticipant = await this.isConversationParticipant(
      conversationId,
      userId,
    );

    if (!isParticipant) {
      return {
        success: false,
        message: 'You are not a participant in this conversation.',
      };
    }

    await client.leave(conversationId);

    return {
      success: true,
      conversationId,
    };
  }

  /**
   * ============================================================
   * TYPING INDICATOR
   * ============================================================
   */

  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody()
    data: {
      conversationId: string;
    },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const userId = this.getAuthenticatedUser(client);

    if (!userId) {
      return;
    }

    if (!data?.conversationId) {
      return;
    }

    const isParticipant = await this.isConversationParticipant(
      data.conversationId,
      userId,
    );

    if (!isParticipant) {
      return;
    }

    const senderSocketId = this.getSocketId(userId);

    const typingData = {
      conversationId: data.conversationId,
      senderId: userId,
    };

    /**
     * Do not send the typing event back to the sender.
     */
    if (senderSocketId) {
      this.server
        .to(data.conversationId)
        .except(senderSocketId)
        .emit('typing', typingData);
    } else {
      this.server.to(data.conversationId).emit('typing', typingData);
    }
  }

  /**
   * ============================================================
   * BROADCAST NEW MESSAGE
   * ============================================================
   *
   * This method is called by MessagesService after the REST
   * authorization checks have succeeded.
   */
  sendMessage(conversationId: string, message: any) {
    this.server.to(conversationId).emit('newMessage', message);
  }

  /**
   * ============================================================
   * BROADCAST REACTION UPDATE
   * ============================================================
   */

  sendReactionUpdate(
    conversationId: string,
    data: {
      messageId: string;
      reactions: any[];
    },
  ) {
    this.server.to(conversationId).emit('reactionUpdated', data);
  }

  /**
   * ============================================================
   * ONLINE STATUS HELPERS
   * ============================================================
   */

  isOnline(userId: string) {
    const sockets = this.userSockets.get(userId);

    return !!sockets && sockets.size > 0;
  }

  getLastSeen(userId: string) {
    return this.lastSeen.get(userId) || null;
  }

  /**
   * Get one socket belonging to a user.
   */
  private getSocketId(userId: string) {
    const sockets = this.userSockets.get(userId);

    if (!sockets || sockets.size === 0) {
      return undefined;
    }

    return [...sockets][0];
  }
}
