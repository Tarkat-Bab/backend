import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { ChatService } from './chat.service';
import { ConversationType } from './enums/conversationType.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { LanguagesEnum } from 'src/common/enums/lang.enum';

@WebSocketGateway({
  cors: { origin: '*' },
  maxHttpBufferSize: 10e6, // 10MB for image uploads
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly chatService: ChatService,
    private readonly notificationsService: NotificationsService,
  ) {}

  server: Server;

  afterInit(server: Server) {
    this.server = server;
    console.log('ChatGateway initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client Connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    const conversationId = client.data?.currentConversationId;

    console.log(`Client Disconnected: ${client.id} - User: ${userId || 'unknown'} - Conversation: ${conversationId || 'none'}`);

    // Notify room if user was in a conversation
    if (conversationId) {
      const room = `conv_${conversationId}`;
      this.server.to(room).emit('userLeft', {
        userId,
        conversationId,
      });
    }

    // Optionally leave the personal user room if present
    if (userId) {
      try {
        client.leave(`user_${userId}`);
      } catch (err) {
        // ignore
      }
    }
  }

  /**
   * Client requests their conversations list.
   * We respond ONLY to the requesting client (no broadcast).
   * Also store userId on socket and join a personal room user_<id> for future targeted emits.
   */
  @SubscribeMessage('allConversations')
  async allConversations(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: number; type?: ConversationType; includeMessages?: boolean },
  ) {
    try {
      // persist userId on socket
      const prevUserId = client.data?.userId;
      client.data.userId = data.userId;

      // if switched user, leave previous personal room
      if (prevUserId && prevUserId !== data.userId) {
        try {
          client.leave(`user_${prevUserId}`);
        } catch (err) {}
      }

      // join personal room for this user (useful for server-side emits)
      client.join(`user_${data.userId}`);

      const conversations = await this.chatService.getUserConversations(
        data.userId,
        data.type,
        data.includeMessages || false,
      );

      // Emit only to the requesting client
      client.emit('allConversations', conversations);

      return conversations;
    } catch (error) {
      console.error('❌ Error in allConversations:', error);
      throw error;
    }
  }

  /**
   * Safely fetch sockets for a given userId.
   */
  private async getSocketsByUserId(userId: number){
    if (!this.server) return [];
    const sockets = await this.server.fetchSockets();
    return sockets.filter(s => s.data?.userId === userId);
  }

  /**
   * Emit updated conversations list to all sockets of a specific user.
   */
  async emitConversationsUpdate(userId: number, type?: ConversationType, includeMessages: boolean = false) {
    try {
      const conversations = await this.chatService.getUserConversations(userId, type, includeMessages);

      // Prefer emitting to user's personal room if we have it
      const userRoom = `user_${userId}`;
      if (this.server.sockets.adapter.rooms.has(userRoom)) {
        this.server.to(userRoom).emit('allConversations', conversations);
        return;
      }

      // Fallback: emit directly to each socket for the user
      const userSockets = await this.getSocketsByUserId(userId);
      userSockets.forEach(socket => {
        try {
          socket.emit('allConversations', conversations);
        } catch (err) {
          console.error(`❌ Failed to emit allConversations to socket ${socket.id}`, err);
        }
      });
    } catch (err) {
      console.error('❌ Error in emitConversationsUpdate:', err);
    }
  }

  @SubscribeMessage('joinConversation')
  async onJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: number; receiverId: number; type?: ConversationType },
  ) {
    try {
      const result = await this.chatService.createOrGetConversation(
        data.userId,
        data.receiverId,
        data.type,
      );

      const conversation = result.conversation;
      const isNewConversation = result.isNew;

      // Verify user is a participant in this conversation (only if not new)
      if (!isNewConversation) {
        const isParticipant = await this.chatService.isUserParticipant(conversation.id, data.userId);
        if (!isParticipant) {
          throw new Error('Unauthorized: User is not a participant in this conversation');
        }
      }

      // Leave all previous conversation rooms before joining new one
      // Note: client.rooms is a Set including socket.id and joined rooms
      const currentRooms = Array.from(client.rooms);
      for (const roomName of currentRooms) {
        if (typeof roomName === 'string' && roomName.startsWith('conv_') && roomName !== client.id) {
          try {
            await client.leave(roomName);
            console.log(`User ${data.userId} left room: ${roomName}`);
          } catch (err) {
            console.warn(`Failed to leave room ${roomName} for socket ${client.id}`, err);
          }
        }
      }

      const room = `conv_${conversation.id}`;

      // Set socket data and join room
      client.data.userId = data.userId;
      client.data.currentConversationId = conversation.id;
      await client.join(room);

      console.log(`User ${data.userId} joined room: ${room}`);

      // load messages and update last seen in parallel
      const [messages] = await Promise.all([
        this.chatService.getConversationMessages(conversation.id),
        this.chatService.updateLastSeen(conversation.id, data.userId),
      ]);

      // Bulk mark unread messages as read (only messages not sent by this user)
      const unreadMessageIds = messages
        .filter((msg) => !msg.isRead && msg.sender.id !== data.userId)
        .map(msg => msg.id);

      if (unreadMessageIds.length > 0) {
        try {
          await this.chatService.markMultipleAsRead(unreadMessageIds);
          // Emit once for all read messages to the room
          this.server.to(room).emit('messagesRead', { messageIds: unreadMessageIds });
        } catch (err) {
          console.error('❌ Failed to markMultipleAsRead:', err);
        }
      }

      // Send the conversation messages only to the joining client
      client.emit('conversationMessages', messages);

      // Notify others in the room that user joined
      client.to(room).emit('userJoined', {
        userId: data.userId,
        conversationId: conversation.id,
      });

      // Update conversations list for both participants (non-blocking)
      const participantIds = await this.chatService.getConversationParticipants(conversation.id);
      await Promise.all([
        ...participantIds.map(id => this.emitConversationsUpdate(id))
      ]);

      return { conversationId: conversation.id, messages, isNewConversation };
    } catch (error) {
      console.error('❌ Error in onJoinConversation:', error);
      throw error;
    }
  }

  @SubscribeMessage('sendMessage')
  async onSendMessage(
    @MessageBody()
    data: { conversationId: number; senderId: number; content?: string; file?: Express.Multer.File; lang?: LanguagesEnum },
  ) {
    try {
      // Verify sender is a participant in this conversation
      const isParticipant = await this.chatService.isUserParticipant(data.conversationId, data.senderId);
      if (!isParticipant) {
        throw new Error('Unauthorized: User is not a participant in this conversation');
      }

      const msg = await this.chatService.sendMessage(
        data.conversationId,
        data.senderId,
        data.content || '',
        data.file,
      );

      const room = `conv_${data.conversationId}`;

      // Emit to the room (includes sender)
      this.server.to(room).emit('newMessage', msg);

      console.log(`Message sent to room ${room}, conversationId: ${data.conversationId}`);

      // Get all participants
      const participantIds = await this.chatService.getConversationParticipants(data.conversationId);

      // Fetch sockets once for presence checks
      const allSockets = await this.server.fetchSockets();

      // Update conversations and send notifications in parallel
      const updates = participantIds.map(async (participantId) => {
        // Update conversation list
        await this.emitConversationsUpdate(participantId);

        // Send notification only to receivers (not sender) who are NOT in the conversation room
        if (participantId !== data.senderId) {
          const isInConversationRoom = allSockets.some(
            s => s.data?.userId === participantId && s.rooms.has(room)
          );

          if (!isInConversationRoom) {
            try {
              const messageContent = msg.content || (msg.imageUrl ? 'صورة 📷 Image' : 'رسالة جديدة New message');
              await this.notificationsService.autoNotification(
                participantId,
                'NEW_CHAT_MESSAGE',
                {
                  senderName: msg.sender.username,
                  messageContent: messageContent,
                  id: String(data.conversationId),
                  params: {
                    conversationId: data.conversationId,
                    senderId: data.senderId,
                  },
                },
                data.lang || LanguagesEnum.ENGLISH,
              );
            } catch (notifError) {
              console.error(`❌ Failed to send notification to user ${participantId}:`, notifError);
            }
          }
        }
      });

      await Promise.all(updates);

      return msg;
    } catch (error) {
      console.error('❌ Error in sendMessage:', error);
      throw error;
    }
  }

  @SubscribeMessage('leaveConversation')
  async onLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number; userId: number },
  ) {
    try {
      const room = `conv_${data.conversationId}`;
      await client.leave(room);
      client.data.currentConversationId = null;

      console.log(`User ${data.userId} left conversation room: ${room}`);

      this.server.to(room).emit('userLeft', {
        userId: data.userId,
        conversationId: data.conversationId,
      });
    } catch (err) {
      console.error('❌ Error in leaveConversation:', err);
      throw err;
    }
  }

  @SubscribeMessage('typing')
  handleTyping(@MessageBody() data: { conversationId: number; userId: number }) {
    try {
      const room = `conv_${data.conversationId}`;
      this.server.to(room).emit('userTyping', data.userId);
    } catch (err) {
      console.error('❌ Error in handleTyping:', err);
    }
  }

  @SubscribeMessage('readMessage')
  async onReadMessage(@MessageBody() data: { messageId: number; conversationId: number; userId?: number; type?: ConversationType }) {
    try {
      // Verify user is a participant in this conversation
      if (data.userId) {
        const isParticipant = await this.chatService.isUserParticipant(data.conversationId, data.userId);
        if (!isParticipant) {
          throw new Error('Unauthorized: User is not a participant in this conversation');
        }
      }

      const room = `conv_${data.conversationId}`;

      // Mark as read and get participants in parallel
      const [, participantIds] = await Promise.all([
        this.chatService.markAsRead(data.messageId),
        this.chatService.getConversationParticipants(data.conversationId),
      ]);

      this.server.to(room).emit('messageRead', {
        messageId: data.messageId,
        isRead: true,
      });

      // Update conversation list for all participants in parallel
      await Promise.all(
        participantIds.map(participantId => this.emitConversationsUpdate(participantId))
      );
    } catch (err) {
      console.error('❌ Error in onReadMessage:', err);
      throw err;
    }
  }
}
