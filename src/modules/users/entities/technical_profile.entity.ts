import { AfterLoad, Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from "typeorm";
import { UserEntity } from "./users.entity";
import { BaseEntity } from "src/common/baseEntity/baseEntity";
import { MediaDir } from "src/common/files/media-dir-.enum";
import { join } from "path";
import { NationalityEntity } from "src/modules/nationalties/entities/nationality.entity";
import { ServiceEntity } from "src/modules/services/entities/service.entity";


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

    @OneToMany(() => ServiceEntity, service => service.technicalProfile)
    services: ServiceEntity[];

    @AfterLoad()
    async MediaUrl() {
        if (typeof this.workLicenseImage === 'string' && process.env.APP_URL) {
            const fullPath = join('api', process.env.MEDIA_DIR, MediaDir.WORKLICENSE, this.workLicenseImage);
            this.workLicenseImage = `${process.env.APP_URL}/${fullPath}`;
        }
        if (typeof this.identityImage === 'string' && process.env.APP_URL) {
            const fullPath = join('api', process.env.MEDIA_DIR, MediaDir.IDENTITY, this.identityImage);
            this.identityImage = `${process.env.APP_URL}/${fullPath}`;
        }
    }
}