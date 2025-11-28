import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationEntity } from './entities/conversation.entity';
import { ConversationParticipantEntity } from './entities/conversation_participant.entity';
import { MessageEntity } from './entities/message.entity';
import { UserEntity } from '../users/entities/users.entity';
import { ConversationType } from './enums/conversationType.enum';
import { MessageType } from './enums/messageType.enum';
import { CloudflareService } from 'src/common/files/cloudflare.service';

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

    private readonly cloudflareService: CloudflareService

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
    file?: Express.Multer.File
  ) {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    const sender = await this.userRepo.findOne({ where: { id: senderId } });
    if(!sender){
      throw new NotFoundException("Sender not found");
    }

    let type = MessageType.TEXT;
    let imageUrl: string | null = null;

    if(file){
      type = MessageType.FILE;
      const image = await this.cloudflareService.uploadFile(file);
      imageUrl = image?.url || null;
    }
    
    const message = this.messageRepo.create({
      conversation,
      sender,
      content,
      type,
      imageUrl
    });
    
    await this.messageRepo.save(message);
    return this.getOneMessage(message.id);
  }

  async getOneMessage(messageId: number){
    const message = await this.messageRepo
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.conversation', 'conversation')
      .select([
        'message.id',
        'message.content',
        'message.createdAt',
        'message.isRead',
        'message.imageUrl',
        'message.type',
        'sender.id',
        'sender.username',
        'sender.image',
        'conversation.id',
        'conversation.type',
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
          imageUrl: true,
          type: true,
          sender:{id: true, username:true},
          conversation:{id:true}
      }
    });
  }
async getUserConversations(
  userId: number,
  type?: ConversationType,
  includeMessages: boolean = false
) {
  let query = this.conversationRepo
    .createQueryBuilder("conversation")
    .distinct(true)
    .innerJoin("conversation.participants", "userParticipant", "userParticipant.user_id = :userId", { userId })
    .leftJoinAndSelect("conversation.participants", "participant")
    .leftJoinAndSelect("participant.user", "user")
    .where("user.deleted = false")
    .andWhere("conversation.deleted = false");

  // Only filter by type if provided
  if (type) {
    query = query.andWhere("conversation.type = :conversationType", { conversationType: type });
  }

  const conversations = await query
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

    const conversationData: any = {
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
    };

    // Include all messages if requested
    if (includeMessages) {
      conversationData.messages = await this.getConversationMessages(conv.id);
    }

    result.push(conversationData);
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
    //console.log(`createOrGetConversation`)
    let conversation = await this.conversationRepo
      .createQueryBuilder('conversation')
      .innerJoin('conversation.participants', 'p1', 'p1.user_id = :u1', { u1: senderId })
      .innerJoin('conversation.participants', 'p2', 'p2.user_id = :u2', { u2: receiverId })
      .groupBy('conversation.id')
      .getOne();

  
    if (conversation) return { conversation, isNew: false };
  
    //use transaction to avoid race condition
    const result = await this.conversationRepo.manager.transaction(async (manager) => {
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
    
      if (conversation) return { conversation, isNew: false };
    
      // create if still not exists
      const newConv = await this.createConversation(type, [senderId, receiverId]);
      return { conversation: newConv, isNew: true };
    });
    
    return result;
  }

  async getConversationParticipants(conversationId: number): Promise<number[]> {
    const participants = await this.participantRepo.find({
      where: { conversation: { id: conversationId } },
      relations: ['user'],
    });
    return participants.map(p => p.user.id);
  }

}
