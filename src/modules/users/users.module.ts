import { Module } from '@nestjs/common';
import { TypeOrmModule }  from '@nestjs/typeorm';

import { UsersController } from './users.controller';
import { UsersService    } from './services/users.service';
import { UserEntity      } from './entities/users.entity';
import { LocationService } from '../locations/location.service';
import { LocationsModule } from '../locations/locations.module';
import { TechnicalProfileEntity } from './entities/technical_profile.entity';
import { UserFcmTokenEntity } from './entities/user-fcm-token.entity';
import { NationaltiesModule } from '../nationalties/nationalties.module';
import { ServicesModule } from '../services/services.module';
import { PaginatorModule } from 'src/common/paginator/paginator.module';
import { CloudflareService } from 'src/common/files/cloudflare.service';
import { CitiesEntity } from '../regions/entities/cities.entity';

@Module({
  imports: [
    LocationsModule,
    NationaltiesModule,
    ServicesModule,
    PaginatorModule,
    TypeOrmModule.forFeature([ UserEntity, TechnicalProfileEntity, UserFcmTokenEntity, CitiesEntity ])
  ],
  controllers: [ UsersController],
  providers  : [ UsersService, LocationService, CloudflareService ],
  exports    : [ UsersService ],
})
export class UsersModule {}
