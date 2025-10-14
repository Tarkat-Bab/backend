import { BaseEntity } from "src/common/baseEntity/baseEntity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { ServiceRequestsEntity } from "./service_requests.entity";
import { UserEntity } from "src/modules/users/entities/users.entity";

@Entity("request_offers")
export class RequestOffersEntity extends BaseEntity {
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @Column({ type: 'boolean', default: false })
    needsDelivery: boolean;
    
    @Column({ type: 'text', nullable: false })
    description: string;

    @Column({ type: 'double precision', nullable: true })
    latitude: number;

    @Column({ type: 'double precision', nullable: true })
    longitude: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    arAddress: string;
    
    @Column({ type: 'varchar', length: 255, nullable: true })
    enAddress: string
    
    @ManyToOne(() => ServiceRequestsEntity, serviceRequest => serviceRequest.offers)
    @JoinColumn({ name: 'request_id' })
    request: ServiceRequestsEntity;

    @ManyToOne(() => UserEntity, user => user.id, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'technical_id' })
    technician: UserEntity;
}