import { join } from "path/win32";
import { BaseEntity } from "src/common/baseEntity/baseEntity";
import { MediaDir } from "src/common/files/media-dir-.enum";
import { TechnicalProfileEntity } from "src/modules/users/entities/technical_profile.entity";
import { AfterLoad, Column, Entity, ManyToOne } from "typeorm";

@Entity('services')
export class ServiceEntity extends BaseEntity {
    @Column({ type: 'varchar', unique: true })
    arName: string;
    
    @Column({ type: 'varchar', unique: true })
    enName: string;

    @Column({ type: 'text', nullable: true })
    icone: string;

    @ManyToOne(() => TechnicalProfileEntity, technicalProfile => technicalProfile.services, { onDelete: 'CASCADE' })
    technicalProfile: TechnicalProfileEntity;
    
    @AfterLoad()
    async MediaUrl() {
        if (typeof this.icone === 'string' && process.env.APP_URL) {
            const fullPath = join('api', process.env.MEDIA_DIR, MediaDir.SERVICES, this.icone);
            this.icone = `${process.env.APP_URL}/${fullPath}`;
        }
    }
}