import { Module } from '@nestjs/common';
import { DashboardAuthController } from './auth.controller';
import { DashboardAuthService } from './auth.service';
import { AuthModule } from 'src/modules/auth/auth.module';

@Module({
    imports: [
        AuthModule,
    ],
    controllers: [DashboardAuthController],
    providers: [DashboardAuthService],
})
export class DashboardAuthModule {}
