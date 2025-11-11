import { Module } from '@nestjs/common';
import { DashboardRegionsController } from './regions.controller';
import { DashboardRegionsService } from './regions.service';
import { RegionsModule } from 'src/modules/regions/regions.module';

@Module({
    imports:[ RegionsModule],
    controllers: [DashboardRegionsController],
    providers: [DashboardRegionsService]
})
export class DashboardRegionsModule {}
