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
    console.log('Chat Gateway Initialized');
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
    console.log(`User ${data.userId} subscribed to allConversations on socket ${client.id}`);
    
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
    
    console.log(`Emitting conversations update to user ${userId}, found ${userSockets.length} socket(s)`);
    
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

    const room = `conv_${conversation.id}`;
    
    // Store userId in socket data for notification checking and targeted updates
    client.data.userId = data.userId;
    
    // Join conversation room (only participants will be in this room)
    client.join(room);

    await this.chatService.updateLastSeen(conversation.id, data.userId);

    const messages = await this.chatService.getConversationMessages(conversation.id);
    const unreadMessages = messages.filter(
      (msg) => !msg.isRead && msg.sender.id !== data.userId,
    );

    await Promise.all(unreadMessages.map((msg) => this.chatService.markAsRead(msg.id)));

    unreadMessages.forEach((msg) => {
      this.server.to(room).emit('messageRead', { messageId: msg.id });
    });

    client.emit('conversationMessages', messages);
    this.server.to(room).emit('userJoined', {
      userId: data.userId,
      conversationId: conversation.id,
    });

    // Update conversations list for both users in real-time
    // Uses socket.data.userId to target specific users only
    await this.emitConversationsUpdate(data.userId, data.type);
    await this.emitConversationsUpdate(data.receiverId, data.type);

    return { conversationId: conversation.id , messages, isNewConversation};
  }

  @SubscribeMessage('sendMessage')
  async onSendMessage(
    @MessageBody()
    data: { conversationId: number; senderId: number; content?: string; file?: Express.Multer.File; lang?: LanguagesEnum },
  ) {
    try {
      const msg = await this.chatService.sendMessage(
        data.conversationId,
        data.senderId,
        data.content || '',
        data.file,
      );

      const room = `conv_${data.conversationId}`;
      
      this.server.to(room).emit('newMessage', msg);

      // Get all participants and update their conversation lists
      const participantIds = await this.chatService.getConversationParticipants(data.conversationId);
      
      console.log('Updating conversations for participants:', participantIds);
      
      // Get all connected sockets to check who is online
      const allSockets = await this.server.fetchSockets();

      for (const participantId of participantIds) {
        await this.emitConversationsUpdate(participantId, msg.conversation.type);
        
        // Send notification only to receivers (not sender) who are NOT in the conversation room
        if (participantId !== data.senderId) {
          try {
            console.log(`🔍 Checking notification for user ${participantId}`);
            console.log(`   - Sender: ${data.senderId}`);
            console.log(`   - Room: ${room}`);
            
            const isInConversationRoom = allSockets.some(
              s => s.data?.userId === participantId && s.rooms.has(room)
            );
            
            console.log(`   - Is in conversation room: ${isInConversationRoom}`);
            
            // Only send notification if user is not actively viewing this conversation
            if (!isInConversationRoom) {
              const messageContent = msg.content || (msg.imageUrl ? 'صورة 📷 Image' : 'رسالة جديدة New message');
              
              console.log(`   - Sending notification with content: "${messageContent}"`);
              
              const result = await this.notificationsService.autoNotification(
                participantId,
                'NEW_CHAT_MESSAGE',
                {
                  senderName: msg.sender.username,
                  messageContent: messageContent,
                  conversationId: data.conversationId,
                  senderId: data.senderId,
                },
                data.lang || LanguagesEnum.ENGLISH,
              );
              
              console.log(`📬 Notification sent to user ${participantId}:`, result);
            } else {
              console.log(`⏭️ User ${participantId} is in conversation room, skipping notification`);
            }
          } catch (notifError) {
            console.error(`❌ Failed to send notification to user ${participantId}:`, notifError);
            // Continue even if notification fails
          }
        } else {
          console.log(`⏭️ Skipping notification for sender ${participantId}`);
        }
      }

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
    await this.chatService.markAsRead(data.messageId);
    const room = `conv_${data.conversationId}`;
    
    this.server.to(room).emit('messageRead', { 
      messageId: data.messageId,
      isRead: true 
    });

    // Update conversation list for all participants to reflect read status
    const participantIds = await this.chatService.getConversationParticipants(data.conversationId);
    
    for (const participantId of participantIds) {
      await this.emitConversationsUpdate(participantId, data.type);
    }
  }
}
