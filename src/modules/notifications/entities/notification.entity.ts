import { BaseEntity } from "src/common/baseEntity/baseEntity";
import { Column, Entity, OneToMany } from "typeorm";
import { ReceiverTypes } from "../enums/receiverTypes.enum";
import { UsersNotifications } from "./usersNotifications.entity";

@Entity('notifications')
export class NotificationsEntity extends BaseEntity {
    @Column({type: 'varchar'})
    arTitle : string;

    @Column({type: 'varchar'})
    enTitle : string;

    @Column({type: 'varchar'})
    arBody : string;

    @Column({type: 'varchar'})
    enBody : string;

    @Column({type: 'varchar', enum: ReceiverTypes, default: ReceiverTypes.INDIVIDUAL})
    receiverTypes: ReceiverTypes;

    @OneToMany(() => UsersNotifications, (userNotification) => userNotification.notification)
    userNotifications: UsersNotifications[];
}