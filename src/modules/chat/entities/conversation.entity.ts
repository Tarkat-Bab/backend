import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/baseEntity/baseEntity';
import { ConversationParticipantEntity } from './conversation_participant.entity';
import { MessageEntity } from './message.entity';
import { ConversationType } from '../enums/conversationType.enum';

@Entity('conversations')
export class ConversationEntity extends BaseEntity {
  @Column({
    type: 'enum',
    enum: ConversationType,
    nullable: false,
  })
  type: ConversationType;

  @Column({ type: 'boolean', default: false })
  isClosed: boolean;

  @OneToMany(
    () => ConversationParticipantEntity,
    (participant) => participant.conversation,
    { cascade: true },
  )
  participants: ConversationParticipantEntity[];

  @OneToMany(() => MessageEntity, (message) => message.conversation, {
    cascade: true,
  })
  messages: MessageEntity[];
}
