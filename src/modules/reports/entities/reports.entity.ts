import { BaseEntity } from "src/common/baseEntity/baseEntity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { ReportReason } from "../enums/reports.enum";
import { ServiceRequestsEntity } from "src/modules/requests/entities/service_requests.entity";
import { UserEntity } from "src/modules/users/entities/users.entity";
import { ReportsMedia } from "./reports_media.entity";

@Entity("reports")
export class ReportsEntity extends BaseEntity {
    @Column({ type: 'varchar', unique: true })
    reportNumber: string;

    @Column({ type: 'varchar', enum: ['user', 'technician'] })
    type: string;
    
    @Column({ type: 'enum', enum: ReportReason, default: ReportReason.other })
    reason: ReportReason;

    @Column({ type: 'text' })
    message: string;

    @Column({ type: 'boolean', default: false })
    resolved: boolean;
    
    @OneToMany(() => ReportsMedia, media => media.report, { cascade: true, eager: true })
    media: ReportsMedia[];

    @ManyToOne(() => ServiceRequestsEntity, request => request.id, { nullable: true })
    @JoinColumn({ name: 'request_id' })
    request: ServiceRequestsEntity;

    @ManyToOne(() => UserEntity, user => user.id, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'reporter_id' })
    reporter: UserEntity;

    @ManyToOne(() => UserEntity, user => user.id, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'reported_id' })
    reported: UserEntity;
}