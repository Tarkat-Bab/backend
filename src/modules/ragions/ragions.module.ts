import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegionEntity } from './entities/ragions.entity';
import { CitiesEntity } from './entities/cities.entity';
import { RagionsController } from './ragions.controller';
import { LocationService } from '../locations/location.service';
import { PaginatorService } from 'src/common/paginator/paginator.service';
import { RegionsService } from './ragions.service';

@Module({
    imports:[
        TypeOrmModule.forFeature([RegionEntity, CitiesEntity])
    ],
    controllers: [RagionsController],
    providers: [LocationService, PaginatorService, RegionsService]
})
export class RagionsModule {}
