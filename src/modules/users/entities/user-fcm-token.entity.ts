import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserEntity } from "./users.entity";

@Entity('user_fcm_tokens')
export class UserFcmTokenEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text' })
    fcm_token: string;

    @ManyToOne(() => UserEntity, user => user.fcmTokens, { onDelete: 'CASCADE' })
    user: UserEntity;
}