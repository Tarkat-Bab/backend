import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'src/common/baseEntity/baseEntity';

@Entity('faqs')
export class FaqEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 500 })
  questionAr: string;

  @Column({ type: 'varchar', length: 500 })
  questionEn: string;

  @Column({ type: 'text' })
  answerAr: string;

  @Column({ type: 'text' })
  answerEn: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
