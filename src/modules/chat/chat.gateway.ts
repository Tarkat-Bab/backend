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

  @SubscribeMessage('allConversations')
  async allConversations(data:{userId: number, conversationId:number}){
    // console.log("All conversations...........")
    const conversations = await this.chatService.getUserConversations(data.userId);

    const room = `conv_${data.conversationId}`;
    this.server.to(room).emit('allConversations', conversations);
    return {conversations}
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

    return { conversationId: conversation.id , messages};
  }

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

    // console.log("Send messages envent: ", { msg})
    return msg;
  }

  @SubscribeMessage('typing')
  handleTyping(@MessageBody() data: { conversationId: number; userId: number }) {
    const room = `conv_${data.conversationId}`;
    this.server.to(room).emit('userTyping', data.userId);
  }

  @SubscribeMessage('readMessage')
  async onReadMessage(@MessageBody() data: { messageId: number; conversationId: number }) {
    console.log("Read msg.....")
    await this.chatService.markAsRead(data.messageId);
    const room = `conv_${data.conversationId}`;
    // this.server.to(room).emit('messageRead', { messageId: data.messageId });
    this.server.to(room).emit('messageRead', { 
    messageId: data.messageId,
    isRead: true 
  });
  }
}
