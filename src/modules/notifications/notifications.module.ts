import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { UsersModule } from '../users/users.module';
import { NotificationsEntity } from './entities/notification.entity';
import { UsersNotifications } from './entities/usersNotifications.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([NotificationsEntity, UsersNotifications]),
        UsersModule,
    ],
    controllers: [NotificationsController],
    providers  : [NotificationsService],
    exports    : [NotificationsService],
})
export class NotificationsModule {}
