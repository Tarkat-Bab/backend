import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from 'src/modules/users/entities/users.entity';
import { NotificationsEntity } from './notification.entity';

@Entity('users_notifications')
export class UsersNotifications {
    @PrimaryGeneratedColumn()
    id: number;
    
    @ManyToOne(() => UserEntity, (user) => user.notifications, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'receiver_id' })
    receiver: UserEntity;
    
    @ManyToOne(() => NotificationsEntity, (notification) => notification.userNotifications, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'notification_id' })
    notification: NotificationsEntity;
}
