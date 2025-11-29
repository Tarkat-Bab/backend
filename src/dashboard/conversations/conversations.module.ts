import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardConversationsController } from './conversations.controller';
import { DashboardConversationsService } from './conversations.service';
import { ConversationEntity } from 'src/modules/chat/entities/conversation.entity';
import { MessageEntity } from 'src/modules/chat/entities/message.entity';
import { ConversationParticipantEntity } from 'src/modules/chat/entities/conversation_participant.entity';
import { ChatModule } from 'src/modules/chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConversationEntity,
      MessageEntity,
      ConversationParticipantEntity,
    ]),
    ChatModule,
  ],
  controllers: [DashboardConversationsController],
  providers: [DashboardConversationsService],
})
export class DashboardConversationsModule {}
