import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationsEntity } from './entities/notification.entity';
import { Repository } from 'typeorm';
import { admin } from './utilies/firebase.config';
import { UsersService } from '../users/services/users.service';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(NotificationsEntity)
        private readonly notificationRepo: Repository<NotificationsEntity>,
        private readonly usersService: UsersService
    ){}

    async sendNotification(userIds: number[], { title, body }: { title: string; body: string }) {
        const tokens = await this.usersService.getFcmTokensByUserIds(userIds);
        const message = {
            notification: {
                title,
                body,
            },
            tokens: tokens.map(t => t.fcm_token),
        };

        try {
            const response = await admin.messaging().sendEachForMulticast(message);
            console.log('✅ Notifications sent:', response.successCount, 'success');
            return { success: true, response };
        } catch (error) {
            console.error('❌ Error sending notifications:', error);
            return { success: false, error };
        }
    }

    async saveNotification(senderId: number, receiverId: number, title: string, body: string){}

}
