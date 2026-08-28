import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  /**
   * socketId -> userId
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

  /**
   * ============================================================
   * CONNECTION
   * ============================================================
   */

  handleConnection(client: Socket) {
    console.log(`Socket connected: ${client.id}`);
  }

  /**
   * ============================================================
   * DISCONNECTION
   * ============================================================
   */

  handleDisconnect(client: Socket) {
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
   * REGISTER USER
   * ============================================================
   */

  @SubscribeMessage('register')
  registerUser(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (!userId) {
      return {
        success: false,
        message: 'User ID is required.',
      };
    }

    /**
     * Associate socket with user.
     */
    this.connectedUsers.set(client.id, userId);

    /**
     * Support multiple sockets per user.
     */
    let sockets = this.userSockets.get(userId);

    const wasOffline = !sockets || sockets.size === 0;

    if (!sockets) {
      sockets = new Set<string>();
      this.userSockets.set(userId, sockets);
    }

    sockets.add(client.id);

    /**
     * User is online again.
     */
    if (wasOffline) {
      this.lastSeen.delete(userId);

      this.server.emit('userOnline', {
        userId,
      });
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
  getOnlineUsers() {
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
  handleJoin(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (!conversationId) {
      return {
        success: false,
        message: 'Conversation ID is required.',
      };
    }

    client.join(conversationId);

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
  handleLeave(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (!conversationId) {
      return {
        success: false,
        message: 'Conversation ID is required.',
      };
    }

    client.leave(conversationId);

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
  handleTyping(
    @MessageBody()
    data: {
      conversationId: string;
      senderId: string;
    },
  ) {
    if (!data?.conversationId || !data?.senderId) {
      return;
    }

    /**
     * Do not send the typing event back to the sender.
     */
    const senderSocketId = this.getSocketId(data.senderId);

    if (senderSocketId) {
      this.server
        .to(data.conversationId)
        .except(senderSocketId)
        .emit('typing', data);
    } else {
      this.server.to(data.conversationId).emit('typing', data);
    }
  }

  /**
   * ============================================================
   * BROADCAST NEW MESSAGE
   * ============================================================
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
