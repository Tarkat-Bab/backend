import { Module } from '@nestjs/common';
import { DashboardUsersService } from './users.service';
import { DashboardUsersController } from './users.controller';
import { UsersModule } from 'src/modules/users/users.module';

@Module({
    imports: [
        UsersModule
    ],
    controllers: [DashboardUsersController],
    providers: [DashboardUsersService],
    exports: [DashboardUsersService],
})
export class DashboardUsersModule {}
