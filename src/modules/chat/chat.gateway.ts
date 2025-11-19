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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
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

  @SubscribeMessage('joinConversation')
  async onJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number; userId: number },
  ) {
    const room = `conv_${data.conversationId}`;
    client.join(room);

    await this.chatService.updateLastSeen(data.conversationId, data.userId);
    const messages = await this.chatService.getConversationMessages(data.conversationId);

    const unreadMessages = messages.filter(
      (msg) => !msg.isRead && msg.sender.id !== data.userId
    );

    for (const msg of unreadMessages) {
      await this.chatService.markAsRead(msg.id);
    }

    for (const msg of unreadMessages) {
      this.server.to(room).emit('messageRead', { messageId: msg.id });
    }

    client.emit('conversationMessages', messages);

    this.server.to(room).emit('userJoined', {
      userId: data.userId,
      conversationId: data.conversationId,
    });
  }


  // Send Message
  @SubscribeMessage('sendMessage')
  async onSendMessage(
    @MessageBody()
    data: {
      conversationId: number;
      senderId: number;
      content: string;
      type?: string;
    },
  ) {
    const msg = await this.chatService.sendMessage(
      data.conversationId,
      data.senderId,
      data.content,
    );

    const room = `conv_${data.conversationId}`;

    // Broadcast to room
    this.server.to(room).emit('newMessage', msg);

    return msg;
  }

  // Typing Indicator
  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { conversationId: number; userId: number },
  ) {
    const room = `conv_${data.conversationId}`;
    this.server.to(room).emit('userTyping', data.userId);
  }

  // Mark as Read
  @SubscribeMessage('readMessage')
  async onReadMessage(
    @MessageBody() data: { messageId: number; conversationId: number },
  ) {
    await this.chatService.markAsRead(data.messageId);

    const room = `conv_${data.conversationId}`;
    this.server.to(room).emit('messageRead', {
      messageId: data.messageId,
    });
  }
}
