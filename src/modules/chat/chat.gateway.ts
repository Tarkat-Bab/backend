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
    console.log(`Client Disconnected: ${client.id}`);
    
    // Leave all rooms when disconnected
    if (client.data?.userId) {
      const userRoom = `user_${client.data.userId}`;
      client.leave(userRoom);
    }
  }


  @SubscribeMessage('allConversations')
  async allConversations(@ConnectedSocket() client: Socket, @MessageBody() data: { userId: number;  type?: ConversationType; includeMessages?: boolean }) {
    const conversations = await this.chatService.getUserConversations(
      data.userId,
      data.type,
      data.includeMessages || false
    );

    // Join both rooms for this user
    const conversationsRoom = `conve_all_${data.userId}`;
    const userRoom = `user_${data.userId}`;
    
    client.join(conversationsRoom);
    client.join(userRoom);
    
    // Store userId in socket data
    client.data.userId = data.userId;
    
    client.emit('allConversations', conversations);
    return conversations;
  }

  async emitConversationsUpdate(userId: number, type?: ConversationType, includeMessages: boolean = false) {
    const conversations = await this.chatService.getUserConversations(userId, type, includeMessages);
    
    // Emit to both the conversations room and the user room
    const conversationsRoom = `conve_all_${userId}`;
    const userRoom = `user_${userId}`;
    
    this.server.to(conversationsRoom).emit('allConversations', conversations);
    this.server.to(userRoom).emit('allConversations', conversations);
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
    const userRoom = `user_${data.userId}`;
    
    // Store userId in socket data for notification checking
    client.data.userId = data.userId;
    
    // Join both conversation room and user room
    client.join(room);
    client.join(userRoom);

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
    // This will work even if they haven't subscribed to allConversations yet
    await this.emitConversationsUpdate(data.userId, data.type);
    await this.emitConversationsUpdate(data.receiverId, data.type);

    return { conversationId: conversation.id , messages, isNewConversation};
  }

  @SubscribeMessage('sendMessage')
  async onSendMessage(
    @MessageBody()
    data: { conversationId: number; senderId: number; content: string; receiverId: number; type?: ConversationType; lang?: LanguagesEnum },
  ) {
    
    const msg = await this.chatService.sendMessage(
      data.conversationId,
      data.senderId,
      data.content,
    );

    const room = `conv_${data.conversationId}`;
    this.server.to(room).emit('newMessage', msg);

    // Update all conversations for both sender and receiver
    this.emitConversationsUpdate(data.senderId, data.type);
    this.emitConversationsUpdate(data.receiverId, data.type);

    // Check if receiver is in the chat room
    const receiverSockets = await this.server.in(room).fetchSockets();
    const isReceiverInRoom = receiverSockets.some(socket => {
      // You may need to store userId in socket data when user joins
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
