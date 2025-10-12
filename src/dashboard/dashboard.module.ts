import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardAuthModule } from './auth/auth.module';
import { AuthModule } from '../modules/auth/auth.module';
import { DashboardUsersModule } from './users/users.module';
import { DashboardUsersController } from './users/users.controller';
import { DashboardRequestsModule } from './requests/requests.module';
import { DashboardRequestsController } from './requests/requests.controller';
import { DashboardRequestsService } from './requests/requests.service';

@Module({
  imports: [DashboardAuthModule, AuthModule, DashboardUsersModule, DashboardRequestsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
