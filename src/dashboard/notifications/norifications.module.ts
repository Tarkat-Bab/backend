import { Module } from "@nestjs/common";
import { NotificationsModule } from "src/modules/notifications/notifications.module";
import { DashboarNotificationsController } from "./norifications.controller";
import { DashboardNotificationService } from "./norifications.service";

@Module({
    imports:[ NotificationsModule],
    controllers: [DashboarNotificationsController],
    providers: [DashboardNotificationService]
})
export class DashboardNotificationModule{}