import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegionEntity } from './entities/Regions.entity';
import { CitiesEntity } from './entities/cities.entity';
import { RegionsController } from './Regions.controller';
import { LocationService } from '../locations/location.service';
import { PaginatorService } from 'src/common/paginator/paginator.service';
import { RegionsService } from './Regions.service';

@Module({
    imports:[
        TypeOrmModule.forFeature([RegionEntity, CitiesEntity])
    ],
    controllers: [RegionsController],
    providers: [LocationService, PaginatorService, RegionsService],
    exports: [RegionsService]
}) 
export class RegionsModule {}
