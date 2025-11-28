import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/baseEntity/baseEntity';
import { UserEntity } from '../../users/entities/users.entity';
import { ConversationEntity } from './conversation.entity';
import { MessageType } from '../enums/messageType.enum';

@Entity('messages')
export class MessageEntity extends BaseEntity {
  @ManyToOne(() => ConversationEntity, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: ConversationEntity;

  @ManyToOne(() => UserEntity, { eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sender_id' })
  sender: UserEntity;

  @Column({ type: 'enum', enum: MessageType, default: MessageType.TEXT })
  type: MessageType;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'text', nullable: true })
  imageUrl : string;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;
}
