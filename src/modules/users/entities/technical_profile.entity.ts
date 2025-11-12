import { AfterLoad, BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from "typeorm";
import { UserEntity } from "./users.entity";
import { BaseEntity } from "src/common/baseEntity/baseEntity";
import { MediaDir } from "src/common/files/media-dir-.enum";
import { join } from "path";
import { NationalityEntity } from "src/modules/nationalties/entities/nationality.entity";
import { ServiceEntity } from "src/modules/services/entities/service.entity";
import { ReviewsEntity } from "src/modules/reviews/entities/review.entity";
import { ServiceRequestsEntity } from 'src/modules/requests/entities/service_requests.entity';


@Entity('technical_profiles')
export class TechnicalProfileEntity extends BaseEntity {
    @OneToOne(() => UserEntity, user => user.technicalProfile, {  onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: UserEntity;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'text', nullable: true })
    workLicenseImage: string;

    @Column({ type: 'text', nullable: true })
    identityImage: string;

    @ManyToOne(() => NationalityEntity, { eager: true })
    @JoinColumn({ name: 'nationality_id' })
    nationality: NationalityEntity;

    @Column({ type: 'float', default: 0 })
    avgRating: number;

    @Column({type: 'boolean', default:null, nullable: true})
    approved: boolean;

    @OneToMany(() => ServiceEntity, service => service.technicalProfile)
    services: ServiceEntity[];

    @OneToMany(() => ReviewsEntity, review => review.technician)
    @JoinColumn()
    reviews: ReviewsEntity[];

    @OneToMany(() => ServiceRequestsEntity, request => request.technician)
    requests: ServiceRequestsEntity[];
}