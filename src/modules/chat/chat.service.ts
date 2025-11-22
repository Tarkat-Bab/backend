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
async getUserConversations(
  userId: number,
  type: ConversationType = ConversationType.CLIENT_TECHNICIAN
) {
  const conversations = await this.conversationRepo
    .createQueryBuilder("conversation")
    .leftJoinAndSelect("conversation.participants", "participant")
    .leftJoinAndSelect("participant.user", "user")
    // .andWhere("conversation.type = :type", { type })
    // .where('participant.user_id = :userId',{userId} )
    .orderBy("conversation.updatedAt", "DESC")
    .getMany();

  const result = [];

  for (const conv of conversations) {
    const recipient = conv.participants.find(p => p.user.id !== userId);

    // ⛔ Skip conversation with no other participant
    if (!recipient) continue;

    const lastMessage = await this.messageRepo
      .createQueryBuilder("message")
      .where("message.conversation_id = :cid", { cid: conv.id })
      .orderBy("message.createdAt", "DESC")
      .leftJoinAndSelect("message.sender", "sender")
      .getOne();

    const unreadCount = await this.messageRepo
      .createQueryBuilder("message")
      .where("message.conversation_id = :cid", { cid: conv.id })
      .andWhere("message.isRead = false")
      .andWhere("message.sender_id != :uid", { uid: userId })
      .getCount();

    result.push({
      conversationId: conv.id,
      type: conv.type,
      updatedAt: conv.updatedAt,
      recipient: {
        id: recipient.user.id,
        username: recipient.user.username,
        image: recipient.user.image,
      },
      lastMessage: lastMessage ? lastMessage.content : null,
      messageDate: lastMessage ? lastMessage.createdAt : null,
      unreadCount,
    });
  }

  return result;
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
    console.log(`createOrGetConversation`)
    let conversation = await this.conversationRepo
      .createQueryBuilder('conversation')
      .innerJoin('conversation.participants', 'p1', 'p1.user_id = :u1', { u1: senderId })
      .innerJoin('conversation.participants', 'p2', 'p2.user_id = :u2', { u2: receiverId })
      .groupBy('conversation.id')
      .getOne();

  
    if (conversation) return conversation;
  
    //use transaction to avoid race condition
    return await this.conversationRepo.manager.transaction(async (manager) => {
      // double-check inside transaction
      conversation = await manager
        .getRepository(ConversationEntity)
        .createQueryBuilder('conversation')
        .leftJoin('conversation.participants', 'participant')
        .addSelect('ARRAY_AGG(participant.user_id) as participant_ids')
        .where('participant.user_id IN (:...ids)', { ids: [senderId, receiverId] })
        .groupBy('conversation.id')
        .having('COUNT(DISTINCT participant.user_id) = 2')
        .getOne();
    
      if (conversation) return conversation;
    
      // create if still not exists
      const newConv = await this.createConversation(type, [senderId, receiverId]);
      return newConv;
    });
  }


}
