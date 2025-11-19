import { Controller, Post, Param, Body, Get } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ConversationType } from './enums/conversationType.enum';
import { MessageType } from './enums/messageType.enum';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
@ApiBearerAuth()
@ApiTags("Chat")
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversation')
  createConversation(
    @Body() body: { type: ConversationType; participantIds: number[] },
  ) {
    return this.chatService.createConversation(body.type, body.participantIds);
  }

  @Post(':id/message')
  sendMessage(
    @Param('id') conversationId: number,
    @Body() body: { senderId: number; content: string; type?: MessageType },
  ) {
    return this.chatService.sendMessage(
      conversationId,
      body.senderId,
      body.content,
      body.type,
    );
  }

  @Get(':id/messages')
  getMessages(@Param('id') conversationId: number) {
    return this.chatService.getConversationMessages(conversationId);
  }

  @Get('user/:userId')
  getUserConversations(@Param('userId') userId: number) {
    return this.chatService.getUserConversations(userId);
  }
}
