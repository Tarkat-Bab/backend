import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { UsersModule } from '../users/users.module';
import { NotificationsEntity } from './entities/notification.entity';
import { UsersNotifications } from './entities/usersNotifications.entity';
import { PaginatorModule } from 'src/common/paginator/paginator.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([NotificationsEntity, UsersNotifications]),
        UsersModule,
        PaginatorModule
    ],
    controllers: [NotificationsController],
    providers  : [NotificationsService],
    exports    : [NotificationsService],
})
export class NotificationsModule {}
