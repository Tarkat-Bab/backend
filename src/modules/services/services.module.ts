import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceEntity } from './entities/service.entity';
import { CloudflareService } from 'src/common/files/cloudflare.service';

@Module({
  imports:[
    TypeOrmModule.forFeature([ServiceEntity])
  ],
  providers: [ServicesService, CloudflareService],
  controllers: [ServicesController],
  exports: [ServicesService]
})
export class ServicesModule {}
