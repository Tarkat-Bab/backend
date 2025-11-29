import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardAuthModule } from './auth/auth.module';
import { AuthModule } from '../modules/auth/auth.module';
import { DashboardUsersModule } from './users/users.module';
import { DashboardRequestsModule } from './requests/requests.module';
import { DashboardReportsModule } from './reports/reports.module';
import { SettingsModule } from './settings/settings.module';
import { DashboardPaymentsModule } from './payments/payments.module';
import { DashboardRegionsModule } from './regions/regions.module';
import { DashboardNotificationModule } from './notifications/notifications.module';
import { DashboardConversationsModule } from './conversations/conversations.module';
import { UsersModule } from 'src/modules/users/users.module';
import { RequestsModule } from 'src/modules/requests/requests.module';
import { ReportsModule } from 'src/modules/reports/reports.module';


@Module({
  imports: [
    DashboardAuthModule, AuthModule, DashboardUsersModule, DashboardRequestsModule, 
    DashboardReportsModule, SettingsModule, DashboardPaymentsModule, DashboardNotificationModule,
    DashboardRegionsModule, DashboardConversationsModule, UsersModule, RequestsModule, ReportsModule
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
