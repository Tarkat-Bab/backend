import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegionEntity } from '../regions/entities/regions.entity';;
import { CitiesEntity } from '../regions/entities/cities.entity';
import { RegionsController } from './regions.controller';
import { LocationService } from '../locations/location.service';
import { PaginatorService } from 'src/common/paginator/paginator.service';
import { RegionsService } from './regions.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { UserEntity } from '../users/entities/users.entity';

@Module({
    imports:[
        TypeOrmModule.forFeature([RegionEntity, CitiesEntity, UserEntity]),
        NotificationsModule
    ],
    controllers: [RegionsController],
    providers: [LocationService, PaginatorService, RegionsService],
    exports: [RegionsService]
}) 
export class RegionsModule {}
