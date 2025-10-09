import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardAuthModule } from './auth/auth.module';
import { AuthModule } from '../modules/auth/auth.module';
import { DashboardUsersModule } from './users/users.module';
import { DashboardUsersController } from './users/users.controller';

@Module({
  imports: [DashboardAuthModule, AuthModule, DashboardUsersModule],
  controllers: [DashboardController, DashboardUsersController],
  providers: [DashboardService],
})
export class DashboardModule {}
