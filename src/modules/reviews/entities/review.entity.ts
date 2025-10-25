import { BaseEntity } from "src/common/baseEntity/baseEntity";
import { TechnicalProfileEntity } from "src/modules/users/entities/technical_profile.entity";
import { UserEntity } from "src/modules/users/entities/users.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";

@Entity('reviews')
export class ReviewsEntity extends BaseEntity {
    @Column({ type: 'int' })
    rate : number;

    @Column({ type: 'text', nullable: true })
    comment : string;
    
    @ManyToOne(() => UserEntity, user => user.id, { onDelete: 'CASCADE' })
    user: UserEntity;

    @ManyToOne(() => TechnicalProfileEntity, tech => tech.reviews)
    @JoinColumn({ name: 'technician_id' })
    technician: TechnicalProfileEntity;

}