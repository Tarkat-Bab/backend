import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationEntity } from './entities/conversation.entity';
import { ConversationParticipantEntity } from './entities/conversation_participant.entity';
import { MessageEntity } from './entities/message.entity';
import { UserEntity } from '../users/entities/users.entity';
import { ConversationType } from './enums/conversationType.enum';
import { MessageType } from './enums/messageType.enum';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ConversationEntity)
    private conversationRepo: Repository<ConversationEntity>,

    @InjectRepository(ConversationParticipantEntity)
    private participantRepo: Repository<ConversationParticipantEntity>,

    @InjectRepository(MessageEntity)
    private messageRepo: Repository<MessageEntity>,

    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,

  ) {}

  // CREATE CONVERSATION
  async createConversation(
    type: ConversationType,
    participantIds: number[],
  ) {
    const conversation = await this.conversationRepo.save({ type });

    const participants = participantIds.map((id) =>
      this.participantRepo.create({
        conversation,
        user: { id } as UserEntity,
      }),
    );

    await this.participantRepo.save(participants);

    return conversation;
  }

  // SEND MESSAGE
  async sendMessage(
    conversationId: number,
    senderId: number,
    content: string,
    type: MessageType = MessageType.TEXT,
  ) {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    const sender = await this.userRepo.findOne({ where: { id: senderId } });

    const message = await this.messageRepo.save({
      conversation,
      sender,
      type,
      content,
    });
    
    return message;
  }

  // MARK MESSAGE AS READ
  async markAsRead(messageId: number) {
    const message = await this.messageRepo.findOne({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found');

    message.isRead = true;
    return this.messageRepo.save(message);
  }

  // GET MESSAGES OF A CONVERSATION
  async getConversationMessages(conversationId: number) {
    return this.messageRepo.find({
      where: { conversation: { id: conversationId } },
      order: { createdAt: 'ASC' },
    });
  }

  // GET USER'S CONVERSATIONS
  async getUserConversations(userId: number) {
    return this.participantRepo.find({
      where: { user: { id: userId } },
      relations: ['conversation', 'conversation.participants', 'conversation.messages'],
      order: { createdAt: 'DESC' },
    });
  }

  // UPDATE LAST SEEN
  async updateLastSeen(conversationId: number, userId: number) {
    const participant = await this.participantRepo.findOne({
      where: {
        conversation: { id: conversationId },
        user: { id: userId },
      },
    });

    if (!participant) throw new NotFoundException('Participant not found');

    participant.lastSeenAt = new Date();
    return this.participantRepo.save(participant);
  }
}
