import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DashboardNotificationService } from './norifications.service';
import { sendNotificationDto } from 'src/modules/notifications/dtos/send-notification.dto';

@ApiBearerAuth()
@ApiTags('Dashboard')
@Controller('dashboard/notifications')
export class DashboarNotificationsController {
    constructor(private readonly notificationsService: DashboardNotificationService) {}
    @Post()
    async sendNotification(
        @Body() notificationDto: sendNotificationDto,
    ) {
        return this.notificationsService.sendNotification(notificationDto);
    }
}
