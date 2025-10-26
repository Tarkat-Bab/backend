import e from "express";
import { BaseEntity } from "src/common/baseEntity/baseEntity";
import { AfterLoad, BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { ReportsEntity } from "./reports.entity";
import { join } from "path/win32";
import { MediaDir } from "src/common/files/media-dir-.enum";

@Entity("reports_media")
export class ReportsMedia extends BaseEntity {
    @Column({ type: 'text' })
    media: string;

    @ManyToOne(() => ReportsEntity, report => report.media)
    @JoinColumn({ name: 'report_id' })
    report: ReportsEntity;
}