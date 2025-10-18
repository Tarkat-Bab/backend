import { BaseEntity } from "src/common/baseEntity/baseEntity";
import { AfterLoad, Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { RequestStatus } from "../enums/requestStatus.enum";
import { ServiceEntity } from "src/modules/services/entities/service.entity";
import { UserEntity } from "src/modules/users/entities/users.entity";
import { RequestOffersEntity } from "./request_offers.entity";
import { RequestsMedia } from "./request_media.entity";

@Entity("service_requests")
export class ServiceRequestsEntity extends BaseEntity {
    @Column({type:'varchar'})
    title: string;

    @Column({type:'text'})
    description: string;
    
    @Column({type:'varchar'})
    latitude: string;
    
    @Column({type:'varchar'})
    longitude: string;
    
    @Column({type:'varchar'})
    arAddress: string;
    
    @Column({type:'varchar'})
    enAddress: string;

    @Column({type:'enum', enum: RequestStatus, default: RequestStatus.PENDING})
    status: RequestStatus;

    @Column({type:'decimal', precision:10, scale:2})
    price: number;

    @OneToMany(() => RequestsMedia, media => media.request, { cascade: true, eager: true })
    media: RequestsMedia[];
    
    @Column({type:'varchar', unique:true})
    requestNumber: string;

    @ManyToOne(() => ServiceEntity, service => service.requests)
    @JoinColumn({ name: 'service_id' })
    service: ServiceEntity;

    @ManyToOne(() => UserEntity, user => user.serviceRequests, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'user_id' })
    user: UserEntity;
    
    @ManyToOne(() => UserEntity, user => user.implementedRequests, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'technician_id' })
    technician: UserEntity;

    @OneToMany(() => RequestOffersEntity, offer => offer.request)
    offers: RequestOffersEntity[];

    @AfterLoad()
    async loadMediaUrls() {
        if (this.media && this.media.length > 0) {
            for (const mediaItem of this.media) {
                try {
                    const url = await mediaItem.MediaUrl();
                    (mediaItem as any).url = url;
                    // console.log('Loaded media URL for media id', mediaItem.id, url);
                } catch (err) {
                    console.warn('Failed loading media URL for media id', mediaItem.id, err?.message ?? err);
                }
            }
        }
    }

}