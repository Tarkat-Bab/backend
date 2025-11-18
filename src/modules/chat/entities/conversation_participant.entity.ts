import { Entity, ManyToOne, Column, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/baseEntity/baseEntity';
import { UserEntity } from '../../users/entities/users.entity';
import { ConversationEntity } from './conversation.entity';

@Entity('conversation_participants')
export class ConversationParticipantEntity extends BaseEntity {
  @ManyToOne(() => ConversationEntity, (conversation) => conversation.participants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: ConversationEntity;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'boolean', default: false })
  isAdmin: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastSeenAt: Date;
}
