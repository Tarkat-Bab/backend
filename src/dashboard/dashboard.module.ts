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
import { DashboardNotificationModule } from './notifications/norifications.module';


@Module({
  imports: [
    DashboardAuthModule, AuthModule, DashboardUsersModule, DashboardRequestsModule, 
    DashboardReportsModule, SettingsModule, DashboardPaymentsModule, DashboardNotificationModule
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
