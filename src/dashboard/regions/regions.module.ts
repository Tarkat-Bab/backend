import { Module } from '@nestjs/common';
import { DashboardRegionsController } from './Regions.controller';
import { DashboardRegionsService } from './Regions.service';
import { RegionsModule } from 'src/modules/Regions/Regions.module';

@Module({
    imports:[ RegionsModule ],
    controllers: [DashboardRegionsController],
    providers: [DashboardRegionsService]
})
export class DashboardRegionsModule {}
