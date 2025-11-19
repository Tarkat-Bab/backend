import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationEntity } from './entities/conversation.entity';
import { ConversationParticipantEntity } from './entities/conversation_participant.entity';
import { MessageEntity } from './entities/message.entity';
import { UserEntity } from '../users/entities/users.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConversationEntity,
      ConversationParticipantEntity,
      MessageEntity,
      UserEntity,
    ]),
  ],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}
