import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ReportsEntity } from './reports.entity';
import { BaseEntity } from 'src/common/baseEntity/baseEntity';

@Entity('reports_replies')
export class ReportReplyEntity extends BaseEntity {
  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'report_id' })
  reportId: number;

  @ManyToOne(() => ReportsEntity, report => report.replies)
  @JoinColumn({ name: 'report_id' })
  report: ReportsEntity;
}
