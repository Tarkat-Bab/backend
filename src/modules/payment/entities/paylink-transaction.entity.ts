import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PaymentEntity } from './payment.entity';

@Entity('paylink_transactions')
export class PaylinkTransactionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', nullable: true })
  merchantEmail: string;

  @Column({ type: 'varchar', unique: true })
  transactionNo: string;

  @Column({ type: 'varchar' })
  merchantOrderNumber: string;

  @Column({ type: 'varchar' })
  orderStatus: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @OneToOne(() => PaymentEntity, (payment) => payment.paylinkTransaction, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'payment_id' })
  payment: PaymentEntity;
}
