import { Module } from "@nestjs/common";
import { NotificationsModule } from "src/modules/notifications/notifications.module";
import { DashboardNotificationsController } from "./notifications.controller";
import { DashboardNotificationService } from "./notifications.service";

@Module({
    imports:[ NotificationsModule],
    controllers: [DashboardNotificationsController],
    providers: [DashboardNotificationService]
})
export class DashboardNotificationModule{}