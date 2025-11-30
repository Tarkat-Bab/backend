import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('coupons')
export class CouponEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  discountPercentage: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  maxDiscountAmount: number;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({ default: false })
  isDefault: boolean;
}
