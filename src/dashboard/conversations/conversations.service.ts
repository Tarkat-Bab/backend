import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationEntity } from 'src/modules/chat/entities/conversation.entity';
import { MessageEntity } from 'src/modules/chat/entities/message.entity';
import { ChatService } from 'src/modules/chat/chat.service';

@Injectable()
export class DashboardConversationsService {
  constructor(
    @InjectRepository(ConversationEntity)
    private conversationRepo: Repository<ConversationEntity>,

    @InjectRepository(MessageEntity)
    private messageRepo: Repository<MessageEntity>,

    private chatService: ChatService,
  ) {}

  async getAllConversations() {
    // First, get conversation IDs that have admin participants
    const conversationsWithAdmins = await this.conversationRepo
      .createQueryBuilder('conversation')
      .innerJoin('conversation.participants', 'participant')
      .innerJoin('participant.user', 'user')
      .where('user.type = :adminType', { adminType: 'admin' })
      .select('conversation.id')
      .getMany();

    const adminConversationIds = conversationsWithAdmins.map(c => c.id);

    // Build main query excluding admin conversations
    let query = this.conversationRepo
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participants', 'participant')
      .leftJoinAndSelect('participant.user', 'user')
      .leftJoin(
        subQuery => {
          return subQuery
            .select('m.conversation_id', 'conv_id')
            .addSelect('MAX(m.created_at)', 'last_msg_date')
            .from('messages', 'm')
            .groupBy('m.conversation_id');
        },
        'lastmsg',
        '"lastmsg"."conv_id" = "conversation"."id"'
      )
      .where('conversation.deleted = false')
      .andWhere('user.deleted = false');

    // Exclude conversations with admin participants
    if (adminConversationIds.length > 0) {
      query = query.andWhere('conversation.id NOT IN (:...adminIds)', { adminIds: adminConversationIds });
    }

    const conversations = await query
      .orderBy('"lastmsg"."last_msg_date"', 'DESC')
      .getMany();

    const conversationIds = conversations.map(c => c.id);

    if (conversationIds.length === 0) {
      return [];
    }

    // Fetch last messages
    const lastMessageData = await this.messageRepo
      .createQueryBuilder('m')
      .select('m.conversation_id', 'conversationId')
      .addSelect('MAX(m.id)', 'maxId')
      .addSelect('MAX(m.created_at)', 'lastDate')
      .where('m.conversation_id IN (:...ids)', { ids: conversationIds })
      .groupBy('m.conversation_id')
      .getRawMany();

    const messageIds = lastMessageData.map(item => item.maxId);

    const lastMessages = messageIds.length > 0
      ? await this.messageRepo
          .createQueryBuilder('message')
          .leftJoinAndSelect('message.sender', 'sender')
          .leftJoinAndSelect('message.conversation', 'conversation')
          .where('message.id IN (:...messageIds)', { messageIds })
          .getMany()
      : [];

    const lastMessageMap = new Map(lastMessages.map(m => [m.conversation?.id, m]));
    const lastDateMap = new Map(lastMessageData.map(d => [d.conversationId, d.lastDate]));

    // Fetch unread counts
    const unreadCounts = await this.messageRepo
      .createQueryBuilder('message')
      .select('message.conversation_id', 'conversationId')
      .addSelect('COUNT(*)', 'count')
      .where('message.conversation_id IN (:...ids)', { ids: conversationIds })
      .andWhere('message.isRead = false')
      .groupBy('message.conversation_id')
      .getRawMany();

    const unreadCountMap = new Map(unreadCounts.map(u => [u.conversationId, parseInt(u.count)]));

    const result = conversations.map(conv => {
      const lastMessage = lastMessageMap.get(conv.id);
      const messageDate = lastDateMap.get(conv.id);
      const unreadCount = unreadCountMap.get(conv.id) || 0;

      return {
        conversationId: conv.id,
        type: conv.type,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        participants: conv.participants.map(p => ({
          id: p.user.id,
          username: p.user.username,
          image: p.user.image,
          type: p.user.type,
        })),
        lastMessage: lastMessage ? lastMessage.content : null,
        messageDate: messageDate || null,
        unreadCount,
      };
    });

    return result;
  }

  async getConversationById(conversationId: number) {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId, deleted: false },
      relations: ['participants', 'participants.user'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const messageCount = await this.messageRepo.count({
      where: { conversation: { id: conversationId }, deleted: false },
    });

    const unreadCount = await this.messageRepo.count({
      where: { conversation: { id: conversationId }, deleted: false, isRead: false },
    });

    return {
      conversationId: conversation.id,
      type: conversation.type,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      participants: conversation.participants.map(p => ({
        id: p.user.id,
        username: p.user.username,
        email: p.user.email,
        phone: p.user.phone,
        image: p.user.image,
        type: p.user.type,
        lastSeenAt: p.lastSeenAt,
      })),
      messageCount,
      unreadCount,
    };
  }

  async getConversationMessages(conversationId: number) {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId, deleted: false },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return await this.chatService.getConversationMessages(conversationId);
  }
}
