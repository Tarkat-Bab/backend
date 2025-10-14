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

    @Column({ type: 'enum', enum: ReportReason, default: ReportReason.other })
    reason: ReportReason;

    @Column({ type: 'text' })
    message: string;

    @OneToMany(() => ReportsMedia, media => media.report, { cascade: true, eager: true })
    media: ReportsMedia[];

    @OneToMany(() => ServiceRequestsEntity, request => request.id, { nullable: true })
    request: ServiceRequestsEntity[];

    @ManyToOne(() => UserEntity, user => user.id, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'user_id' })
    user: UserEntity;

    @ManyToOne(() => UserEntity, user => user.id, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'technician_id' })
    technician: UserEntity;
}