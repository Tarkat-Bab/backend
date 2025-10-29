import { Body, Controller, Post } from '@nestjs/common';
import { sendNotificationDto } from './dtos/send-notification.dto';
import { NotificationsService } from './notifications.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Notifications')
@Controller('Notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}
    @Post()
    async sendNotification(
        @Body() notificationDto: sendNotificationDto,
    ) {
        return this.notificationsService.sendManualNotification(notificationDto);
    }
}
