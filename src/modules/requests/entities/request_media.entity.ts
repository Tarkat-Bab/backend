import e from "express";
import { BaseEntity } from "src/common/baseEntity/baseEntity";
import { AfterLoad, Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { ServiceRequestsEntity } from "./service_requests.entity";
import { join } from "path/win32";
import { MediaDir } from "src/common/files/media-dir-.enum";

@Entity("requests_media")
export class RequestsMedia extends BaseEntity {
    @Column({ type: 'text' })
    media: string;

    @ManyToOne(() => ServiceRequestsEntity, request => request.media)
    @JoinColumn({ name: 'request_id' })
    request: ServiceRequestsEntity;

    @AfterLoad()
    async MediaUrl() {
        if (this.media && process.env.APP_URL) {
            this.media = `${process.env.APP_URL}/${this.media}`;
            const fullPath = join(process.env.MEDIA_DIR, MediaDir.REQUESTS, this.media);
            return `${process.env.APP_URL}/${fullPath}`;
        }
    }
}