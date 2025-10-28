import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { UsersModule } from '../users/users.module';
import { Type } from 'class-transformer';
import { NotificationsEntity } from './entities/notification.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [ 
        UsersModule,
        TypeOrmModule.forFeature([NotificationsEntity])
     ],
    controllers: [NotificationsController],
    providers: [NotificationsService],
    exports: [NotificationsService],
})
export class NotificationsModule {}
