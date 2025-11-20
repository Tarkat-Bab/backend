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

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly chatService: ChatService) {}

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
  }

  // Join or create a conversation
  @SubscribeMessage('joinConversation')
  async onJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: number; receiverId: number; type?: ConversationType },
  ) {
    const conversation = await this.chatService.createOrGetConversation(
      data.userId,
      data.receiverId,
      data.type,
    );

    const room = `conv_${conversation.id}`;
    client.join(room);

    // Update last seen
    await this.chatService.updateLastSeen(conversation.id, data.userId);

    // Get all messages and mark unread as read
    const messages = await this.chatService.getConversationMessages(conversation.id);
    const unreadMessages = messages.filter(
      (msg) => !msg.isRead && msg.sender.id !== data.userId,
    );

    // Mark all unread messages as read in parallel
    await Promise.all(unreadMessages.map((msg) => this.chatService.markAsRead(msg.id)));

    // Notify others in the room about read messages
    unreadMessages.forEach((msg) => {
      this.server.to(room).emit('messageRead', { messageId: msg.id });
    });

    // Send messages to the joining client
    client.emit('conversationMessages', messages);

    // Notify everyone in the room that a new user joined
    this.server.to(room).emit('userJoined', {
      userId: data.userId,
      conversationId: conversation.id,
    });

    return { conversationId: conversation.id };
  }

  // Send message
  @SubscribeMessage('sendMessage')
  async onSendMessage(
    @MessageBody()
    data: { conversationId: number; senderId: number; content: string; type?: ConversationType },
  ) {
    const msg = await this.chatService.sendMessage(
      data.conversationId,
      data.senderId,
      data.content,
    );

    const room = `conv_${data.conversationId}`;
    this.server.to(room).emit('newMessage', msg);

    return msg;
  }

  // Typing indicator
  @SubscribeMessage('typing')
  handleTyping(@MessageBody() data: { conversationId: number; userId: number }) {
    const room = `conv_${data.conversationId}`;
    this.server.to(room).emit('userTyping', data.userId);
  }

  // Mark message as read
  @SubscribeMessage('readMessage')
  async onReadMessage(@MessageBody() data: { messageId: number; conversationId: number }) {
    await this.chatService.markAsRead(data.messageId);
    const room = `conv_${data.conversationId}`;
    this.server.to(room).emit('messageRead', { messageId: data.messageId });
  }
}
