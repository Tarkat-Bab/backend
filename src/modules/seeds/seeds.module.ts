import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedsService } from './seeds.service';
import { SettingEntity } from 'src/dashboard/settings/entities/setting.entity';
import { NationalityEntity } from '../nationalties/entities/nationality.entity';
import { ServiceEntity } from '../services/entities/service.entity';
import { UserEntity } from '../users/entities/users.entity';
import { TechnicalProfileEntity } from '../users/entities/technical_profile.entity';
import { ServiceRequestsEntity } from '../requests/entities/service_requests.entity';
import { ReportsEntity } from '../reports/entities/reports.entity';
import { RequestOffersEntity } from '../requests/entities/request_offers.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SettingEntity,
      NationalityEntity,
      ServiceEntity,
      UserEntity,
      TechnicalProfileEntity,
      ServiceRequestsEntity,
      ReportsEntity,
      RequestOffersEntity,
    ]),
  ],
  providers: [SeedsService],
  exports: [SeedsService],
})
export class SeedsModule {}
