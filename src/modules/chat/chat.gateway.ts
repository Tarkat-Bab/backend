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
    //console.log('Chat Gateway Initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client Connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client Disconnected: ${client.id} - User: ${client.data?.userId || 'unknown'}`);
  }

  @SubscribeMessage('allConversations')
  async allConversations(@ConnectedSocket() client: Socket, @MessageBody() data: { userId: number;  type?: ConversationType; includeMessages?: boolean }) {
    // IMPORTANT: Store userId in socket data for targeted real-time updates
    client.data.userId = data.userId;
    const conversations = await this.chatService.getUserConversations(
      data.userId,
      data.type,
      data.includeMessages || false
    );
    
    const conversationsRoom = `conve_all_${data.userId}`;
    client.to(conversationsRoom).emit('allConversations', conversations);
    return conversations;
  }

  async emitConversationsUpdate(userId: number, type?: ConversationType, includeMessages: boolean = false) {
    const conversations = await this.chatService.getUserConversations(userId, type, includeMessages);
    
    // Get all sockets for this specific user and emit directly to them
    const sockets = await this.server.fetchSockets();
    const userSockets = sockets.filter(socket => socket.data?.userId === userId);
        
    // Emit directly to each socket belonging to this user
    userSockets.forEach(socket => {
      socket.emit('allConversations', conversations);
    });
  }

  @SubscribeMessage('joinConversation')
  async onJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: number; receiverId: number; type?: ConversationType },
  ) {
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

    const room = `conv_${conversation.id}`;
    
    client.data.userId = data.userId;
    client.join(room);

    const [messages] = await Promise.all([
      this.chatService.getConversationMessages(conversation.id),
      this.chatService.updateLastSeen(conversation.id, data.userId)
    ]);

    const unreadMessageIds = messages
      .filter((msg) => !msg.isRead && msg.sender.id !== data.userId)
      .map(msg => msg.id);

    if (unreadMessageIds.length > 0) {
      // Bulk mark as read
      await this.chatService.markMultipleAsRead(unreadMessageIds);

      // Emit once for all read messages
      this.server.to(room).emit('messagesRead', { messageIds: unreadMessageIds });
    }

    this.server.to(room).emit('conversationMessages', messages);
    this.server.to(room).emit('userJoined', {
      userId: data.userId,
      conversationId: conversation.id,
    });

    // Update conversations list only once for both users
    await Promise.all([
      this.emitConversationsUpdate(data.userId),
      this.emitConversationsUpdate(data.receiverId)
    ]);

    return { conversationId: conversation.id , messages, isNewConversation};
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
      this.server.to(room).emit('newMessage', msg);

      // Get all participants
      const participantIds = await this.chatService.getConversationParticipants(data.conversationId);
      
      // Fetch sockets once
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

  @SubscribeMessage('typing')
  handleTyping(@MessageBody() data: { conversationId: number; userId: number }) {
    const room = `conv_${data.conversationId}`;
    this.server.to(room).emit('userTyping', data.userId);
  }

  @SubscribeMessage('readMessage')
  async onReadMessage(@MessageBody() data: { messageId: number; conversationId: number; userId?: number; type?: ConversationType }) {
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
      this.chatService.getConversationParticipants(data.conversationId)
    ]);
    
    this.server.to(room).emit('messageRead', { 
      messageId: data.messageId,
      isRead: true 
    });

    // Update conversation list for all participants in parallel
    await Promise.all(
      participantIds.map(participantId => this.emitConversationsUpdate(participantId))
    );
  }
}
