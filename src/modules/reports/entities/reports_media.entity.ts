import e from "express";
import { BaseEntity } from "src/common/baseEntity/baseEntity";
import { AfterLoad, Column, Entity, JoinColumn, ManyToOne } from "typeorm";
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

    @AfterLoad()
    async MediaUrl() {
        if (this.media && process.env.APP_URL) {
            this.media = `${process.env.APP_URL}/${this.media}`;
            const fullPath = join(process.env.MEDIA_DIR, MediaDir.REPORTS, this.media);
            return `${process.env.APP_URL}/${fullPath}`;
        }
    }
}