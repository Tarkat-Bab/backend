import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationEntity } from './entities/conversation.entity';
import { ConversationParticipantEntity } from './entities/conversation_participant.entity';
import { MessageEntity } from './entities/message.entity';
import { UserEntity } from '../users/entities/users.entity';
import { ConversationType } from './enums/conversationType.enum';
import { MessageType } from './enums/messageType.enum';
import { NotFound } from '@aws-sdk/client-s3';

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
    if(!sender){
      throw new NotFoundException("Sender not found");
    }
    const message = this.messageRepo.create({
      conversation,
      sender,
      type,
      content,
    });
    
    await this.messageRepo.save(message);
    return this.getOneMessage(message.id);
  }

  async getOneMessage(messageId: number){
    const message = await this.messageRepo
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .select([
        'message.id',
        'message.content',
        'message.createdAt',
        'message.isRead',
        'sender.id',
        'sender.username',
        'sender.image',
      ])
      .where('message.id = :id', { id: messageId })
      .getOne();

    if (!message) throw new NotFoundException();
    return message;
  }

  async markAsRead(messageId: number) {
    const message = await this.messageRepo.findOne({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found');

    message.isRead = true;
    return this.messageRepo.save(message);
  }

  async getConversationMessages(conversationId: number) {
    return this.messageRepo.find({
      where: { conversation: { id: conversationId, deleted:false }, deleted: false, sender:{deleted:false}  },
      order: { createdAt: 'ASC' },
      select:{
          id: true,
          content: true,
          createdAt: true,
          isRead: true,
          sender:{id: true, username:true},
          conversation:{id:true}
      }
    });
  }

  async getUserConversations(userId: number) {
    const messages = await this.messageRepo
      .createQueryBuilder("message")
      .leftJoinAndSelect("message.conversation", "conversation")
      .leftJoinAndSelect("message.sender", "sender")
      .leftJoinAndSelect("conversation.participants", "participant")
      .leftJoinAndSelect("participant.user", "user")
      .orderBy("message.createdAt", "DESC")
      .getMany();

    const conversationMap = new Map<number, any>();

    messages.forEach(msg => {
      const convId = msg.conversation.id;
      if (conversationMap.has(convId)) {
        const conv = conversationMap.get(convId);
        if (!msg.isRead && msg.sender.id !== userId) {
          conv.unreadCount += 1;
        }
        return;
      }

      const recipient = msg.conversation.participants.find(p => p.user.id !== userId);

      conversationMap.set(convId, {
        conversationId: convId,
        type: msg.conversation.type,
        updatedAt: msg.conversation.updatedAt,
        recipient: recipient ? {
          id: recipient.user.id,
          username: recipient.user.username,
          image: recipient.user.image,
        } : null,
        lastMessage: msg.content,
        messageDate: msg.createdAt,
        unreadCount: (!msg.isRead && msg.sender.id !== userId) ? 1 : 0,
      });
    });

    return Array.from(conversationMap.values());
  }





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

  async createOrGetConversation(senderId: number, receiverId: number, type: ConversationType = ConversationType.CLIENT_TECHNICIAN) {
    const qb = this.conversationRepo
      .createQueryBuilder('conversation')
      .leftJoin('conversation.participants', 'participant')
      .where('participant.user_id IN (:...ids)', { ids: [senderId, receiverId] })
      .groupBy('conversation.id')
      .having('COUNT(DISTINCT participant.user_id) = 2');
  
    const matchedConversation = await qb.getOne();
  
    if (!matchedConversation) {
      return this.createConversation(type, [senderId, receiverId]);
    }
  
    return matchedConversation;
  }




}
