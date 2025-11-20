import { Controller, Post, Param, Body, Get } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ConversationType } from './enums/conversationType.enum';
import { MessageType } from './enums/messageType.enum';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
@ApiBearerAuth()
@ApiTags("Chat")
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversation/me')
  createOrGetConversation(
    @CurrentUser() user: any,
  ) {
    return this.chatService.getUserConversations(user.id);
  }

  // @Post(':id/message')
  // sendMessage(
  //   @Param('id') conversationId: number,
  //   @Body() body: { senderId: number; content: string; type?: MessageType },
  // ) {
  //   return this.chatService.sendMessage(
  //     conversationId,
  //     body.senderId,
  //     body.content,
  //     body.type,
  //   );
  // }

  // @Get(':id/messages')
  // getMessages(@Param('id') conversationId: number) {
  //   return this.chatService.getConversationMessages(conversationId);
  // }

  // @Get('user/:userId')
  // getUserConversations(@Param('userId') userId: number) {
  //   return this.chatService.getUserConversations(userId);
  // }
}
