import { Module } from '@nestjs/common';
import { RequestsController } from './controllers/requests.controller';
import { RequestsService } from './services/requests.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestOffersEntity } from './entities/request_offers.entity';
import { ServiceRequestsEntity } from './entities/service_requests.entity';
import { UsersModule } from '../users/users.module';
import { RequestsMedia } from './entities/request_media.entity';
import { RequestOffersService } from './services/requests-offers.service';
import { RequestOffersController } from './controllers/requests-offers.controller';

@Module({
    imports: [
        UsersModule,
        TypeOrmModule.forFeature([ServiceRequestsEntity, RequestOffersEntity, RequestsMedia])
    ],
    controllers: [RequestsController, RequestOffersController],
    providers  : [RequestsService, RequestOffersService],
    exports    : [RequestsService, RequestOffersService],
})
export class RequestsModule {}
