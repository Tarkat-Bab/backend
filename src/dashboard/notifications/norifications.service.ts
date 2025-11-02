import { Injectable } from "@nestjs/common";
import { sendNotificationDto } from "src/modules/notifications/dtos/send-notification.dto";
import { NotificationsService } from "src/modules/notifications/notifications.service";

@Injectable()
export class DashboardNotificationService{
    constructor(private readonly notificationsService: NotificationsService) {}
    
   async sendNotification(sendNotificationDto: sendNotificationDto){
        return await this.notificationsService.sendNotification(sendNotificationDto);
   }
}