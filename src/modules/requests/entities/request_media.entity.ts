import { BaseEntity } from "src/common/baseEntity/baseEntity";
import { AfterLoad, BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { ServiceRequestsEntity } from "./service_requests.entity";
import { join } from "path/win32";
import { MediaDir } from "src/common/files/media-dir-.enum";

@Entity("requests_media")
export class RequestsMedia extends BaseEntity {
    @Column({ type: 'text' })
    media: string;

    // @Column({ type: 'text', nullable: true })
    // mediaId: string;

    @ManyToOne(() => ServiceRequestsEntity, request => request.media)
    @JoinColumn({ name: 'request_id' })
    request: ServiceRequestsEntity;

    @BeforeInsert()
    @BeforeUpdate()
    async MediaUrl() {
        if (this.media && process.env.APP_URL) {
            const fullPath = join(process.env.MEDIA_DIR, MediaDir.REQUESTS, this.media);
            // console.log('Full Media Path:', `${process.env.APP_URL}/${fullPath}`);
            return `${process.env.APP_URL}/${fullPath}`;
        }
    }
}