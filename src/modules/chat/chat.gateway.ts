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
import { MessageType } from './enums/messageType.enum';
import { CloudflareService } from 'src/common/files/cloudflare.service';

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
    private readonly cloudflareService: CloudflareService,
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
    data: { conversationId: number; senderId: number; content: string; receiverId: number; messageType: MessageType; type?: ConversationType; lang?: LanguagesEnum },
  ) {
    
    const msg = await this.chatService.sendMessage(
      data.conversationId,
      data.senderId,
      data.content,
      data.messageType,
    );

    const room = `conv_${data.conversationId}`;
    
    // Only emit to the conversation room (participants only)
    this.server.to(room).emit('newMessage', msg);

    // Update conversations list ONLY for the two participants
    await this.emitConversationsUpdate(data.senderId, data.type);
    await this.emitConversationsUpdate(data.receiverId, data.type);

    // Check if receiver is in the chat room
    const receiverSockets = await this.server.in(room).fetchSockets();
    const isReceiverInRoom = receiverSockets.some(socket => {
      return socket.data?.userId === data.receiverId;
    });

    // Send notification only if receiver is not in the chat
    if (!isReceiverInRoom) {
      await this.notificationsService.autoNotification(
        data.receiverId,
        'NEW_CHAT_MESSAGE',
        {
          senderName: msg.sender.username,
          messageContent: data.content.length > 50 ? data.content.substring(0, 50) + '...' : data.content,
          conversationId: data.conversationId,
        },
        data.lang || LanguagesEnum.ENGLISH,
      );
    }

    return msg;
  }

  @SubscribeMessage('sendImage')
  async onSendImage(
    @MessageBody()
    data: { 
      conversationId: number; 
      senderId: number; 
      receiverId: number; 
      image: string; // base64 encoded image
      fileName?: string; // optional original filename
      type?: ConversationType; 
      lang?: LanguagesEnum 
    },
  ) {
    try {
      // Extract mimetype and convert base64 to buffer
      const matches = data.image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error('Invalid base64 image format');
      }

      const mimetype = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      // Create a file object compatible with Cloudflare service
      const file: Express.Multer.File = {
        buffer,
        mimetype,
        originalname: data.fileName || `chat-image-${Date.now()}.jpg`,
        fieldname: 'image',
        encoding: '7bit',
        size: buffer.length,
        stream: null,
        destination: '',
        filename: '',
        path: '',
      };

      // Upload to Cloudflare R2
      const uploadResult = await this.cloudflareService.uploadFile(file);
      const imageUrl = uploadResult.url;

      // Save message with image URL
      const msg = await this.chatService.sendMessage(
        data.conversationId,
        data.senderId,
        imageUrl,
        MessageType.IMAGE,
      );

      const room = `conv_${data.conversationId}`;
      
      // Emit to conversation room
      this.server.to(room).emit('newMessage', msg);

      // Update conversations list
      await this.emitConversationsUpdate(data.senderId, data.type);
      await this.emitConversationsUpdate(data.receiverId, data.type);

      // Check if receiver is in the chat room
      const receiverSockets = await this.server.in(room).fetchSockets();
      const isReceiverInRoom = receiverSockets.some(socket => {
        return socket.data?.userId === data.receiverId;
      });

      // Send notification only if receiver is not in the chat
      if (!isReceiverInRoom) {
        await this.notificationsService.autoNotification(
          data.receiverId,
          'NEW_CHAT_MESSAGE',
          {
            senderName: msg.sender.username,
            messageContent: '📷 Image',
            conversationId: data.conversationId,
          },
          data.lang || LanguagesEnum.ENGLISH,
        );
      }

      return msg;
    } catch (error) {
      console.error('Error sending image:', error);
      throw error;
    }
  }

  @SubscribeMessage('typing')
  handleTyping(@MessageBody() data: { conversationId: number; userId: number }) {
    const room = `conv_${data.conversationId}`;
    this.server.to(room).emit('userTyping', data.userId);
  }

  @SubscribeMessage('readMessage')
  async onReadMessage(@MessageBody() data: { messageId: number; conversationId: number; userId: number; type?: ConversationType }) {
    console.log("Read msg.....")
    await this.chatService.markAsRead(data.messageId);
    const room = `conv_${data.conversationId}`;
    
    this.server.to(room).emit('messageRead', { 
      messageId: data.messageId,
      isRead: true 
    });

    // Update conversation list to reflect read status
    if (data.userId) {
      this.emitConversationsUpdate(data.userId, data.type);
    }
  }
}
