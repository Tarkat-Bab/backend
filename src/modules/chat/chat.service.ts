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
        'message.updatedAt',
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

  async markMultipleAsRead(messageIds: number[]) {
    if (messageIds.length === 0) return;
    
    await this.messageRepo
      .createQueryBuilder()
      .update(MessageEntity)
      .set({ isRead: true })
      .where("id IN (:...ids)", { ids: messageIds })
      .execute();
  }

  async getConversationMessages(conversationId: number) {
    const msgs =  await this.messageRepo.find({
      where: { conversation: { id: conversationId, deleted:false }, deleted: false, sender:{deleted:false}  },
      order: { createdAt: 'ASC' },
      select:{
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          isRead: true,
          imageUrl: true,
          type: true,
          sender:{id: true, username:true},
          conversation:{id:true}
      }
    });

    console.log(msgs)
    return msgs;
  }
  
  async getUserConversations(
    userId: number,
    type?: ConversationType,
    includeMessages: boolean = false
  ) {
    // Get conversations with last message date in a single optimized query
    let query = this.conversationRepo
      .createQueryBuilder("conversation")
      .innerJoin("conversation.participants", "userParticipant", "userParticipant.user_id = :userId", { userId })
      .leftJoinAndSelect("conversation.participants", "participant")
      .leftJoinAndSelect("participant.user", "user")
      .leftJoin(
        subQuery => {
          return subQuery
            .select("m.conversation_id", "conv_id")
            .addSelect("MAX(m.created_at)", "last_msg_date")
            .from("messages", "m")
            .groupBy("m.conversation_id");
        },
        "lastmsg",
        '"lastmsg"."conv_id" = "conversation"."id"'
      )
      .where("conversation.deleted = false")
      .andWhere("user.deleted = false")
      .andWhere('"lastmsg"."last_msg_date" IS NOT NULL');

    // Only filter by type if provided
    if (type) {
      query = query.andWhere("conversation.type = :conversationType", { conversationType: type });
    }

    const conversations = await query
      .orderBy('"lastmsg"."last_msg_date"', "DESC")
      .getMany();

    if (conversations.length === 0) return [];

    const conversationIds = conversations.map(c => c.id);

    // Fetch last messages with their dates in one query
    const lastMessageData = await this.messageRepo
      .createQueryBuilder("m")
      .select("m.conversation_id", "conversationId")
      .addSelect("MAX(m.id)", "maxId")
      .addSelect("MAX(m.created_at)", "lastDate")
      .where("m.conversation_id IN (:...ids)", { ids: conversationIds })
      .groupBy("m.conversation_id")
      .getRawMany();

    const messageIds = lastMessageData.map(item => item.maxId);
    
    const lastMessages = messageIds.length > 0 
      ? await this.messageRepo
          .createQueryBuilder("message")
          .leftJoinAndSelect("message.sender", "sender")
          .leftJoinAndSelect("message.conversation", "conversation")
          .where("message.id IN (:...messageIds)", { messageIds })
          .getMany()
      : [];

    const lastMessageMap = new Map(lastMessages.map(m => [m.conversation.id, m]));
    const lastDateMap = new Map(lastMessageData.map(d => [d.conversationId, d.lastDate]));

    // Fetch all unread counts in one query
    const unreadCounts = await this.messageRepo
      .createQueryBuilder("message")
      .select("message.conversation_id", "conversationId")
      .addSelect("COUNT(*)", "count")
      .where("message.conversation_id IN (:...ids)", { ids: conversationIds })
      .andWhere("message.isRead = false")
      .andWhere("message.sender_id != :uid", { uid: userId })
      .groupBy("message.conversation_id")
      .getRawMany();

    const unreadCountMap = new Map(unreadCounts.map(u => [u.conversationId, parseInt(u.count)]));

    const result = [];

    for (const conv of conversations) {
      const recipient = conv.participants.find(p => p.user.id !== userId);
      if (!recipient) continue;

      const lastMessage = lastMessageMap.get(conv.id);
      const messageDate = lastDateMap.get(conv.id);
      const unreadCount = unreadCountMap.get(conv.id) || 0;

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
        messageDate: messageDate || null,
        unreadCount,
      };

      // Include all messages if requested
      if (includeMessages) {
        conversationData.messages = await this.getConversationMessages(conv.id);
      }

      result.push(conversationData);
    }

    // Results are already sorted by database query (ORDER BY lastMsg.last_msg_date DESC)
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
    // Find existing conversation with exactly these 2 participants and matching type
    let conversation = await this.conversationRepo
      .createQueryBuilder('conversation')
      .innerJoin('conversation.participants', 'p1', 'p1.user_id = :u1', { u1: senderId })
      .innerJoin('conversation.participants', 'p2', 'p2.user_id = :u2', { u2: receiverId })
      .leftJoin('conversation.participants', 'allParticipants')
      // .where('conversation.type = :type', { type })
      .andWhere('conversation.deleted = false')
      .groupBy('conversation.id')
      .having('COUNT(DISTINCT allParticipants.id) = 2')
      .getOne();

    if (conversation) return { conversation, isNew: false };
  
    // Use transaction to avoid race condition
    const result = await this.conversationRepo.manager.transaction(async (manager) => {
      // Double-check inside transaction
      conversation = await manager
        .getRepository(ConversationEntity)
        .createQueryBuilder('conversation')
        .innerJoin('conversation.participants', 'p1', 'p1.user_id = :u1', { u1: senderId })
        .innerJoin('conversation.participants', 'p2', 'p2.user_id = :u2', { u2: receiverId })
        .leftJoin('conversation.participants', 'allParticipants')
        .where('conversation.type = :type', { type })
        .andWhere('conversation.deleted = false')
        .groupBy('conversation.id')
        .having('COUNT(DISTINCT allParticipants.id) = 2')
        .getOne();
    
      if (conversation) return { conversation, isNew: false };
    
      // Create if still not exists
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

  async isUserParticipant(conversationId: number, userId: number): Promise<boolean> {
    const participant = await this.participantRepo.findOne({
      where: {
        conversation: { id: conversationId },
        user: { id: userId },
      },
    });
    return !!participant;
  }

}
