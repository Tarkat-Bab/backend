import { Module } from '@nestjs/common';
import { DashboardRequestsService } from './requests.service';
import { RequestsModule } from 'src/modules/requests/requests.module';
import { DashboardRequestsController } from './requests.controller';

@Module({
    imports: [ RequestsModule ], 
    controllers: [DashboardRequestsController],
    providers: [DashboardRequestsService],
})
export class DashboardRequestsModule {}
