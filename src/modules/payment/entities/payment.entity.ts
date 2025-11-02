import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RequestOffersEntity } from 'src/modules/requests/entities/request_offers.entity';
import { UserEntity } from 'src/modules/users/entities/users.entity';

@Entity('payments')
export class PaymentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true })
  tabbyPaymentId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalClientAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalTechnicianAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  platformAmountFromTech: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  platformAmountFromClient: number;
  
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({ type: 'varchar' })
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.payments)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @OneToOne(() => RequestOffersEntity, (offer) => offer.payment, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'offer_id' })
  offer: RequestOffersEntity;
}
