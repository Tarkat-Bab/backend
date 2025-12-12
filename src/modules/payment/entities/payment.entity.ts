import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RequestOffersEntity } from 'src/modules/requests/entities/request_offers.entity';
import { UserEntity } from 'src/modules/users/entities/users.entity';
import { PaymentTransactionEntity } from './payment-transaction.entity';
import { CouponEntity } from 'src/modules/coupons/entities/coupons.entity';

@Entity('payments')
export class PaymentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true, nullable: true })
  transactionNumber: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalClientAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalClientAmountAfterDiscount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalTechnicianAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  platformAmountFromTech: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  platformAmountFromClient: number;
  
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'varchar', length: 3, default: 'SAR' })
  currency: string;

  @Column({ type: 'varchar', nullable: true })
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

  @ManyToOne(() => CouponEntity, { nullable: true })
  @JoinColumn({ name: 'coupon_id' })
  coupon: CouponEntity;

  @OneToOne(() => PaymentTransactionEntity, (paymentTransaction) => paymentTransaction.payment, {
    cascade: true,
  })
  paymentTransaction: PaymentTransactionEntity;
}
