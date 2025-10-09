import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceEntity } from './entities/service.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([ServiceEntity])
  ],
  providers: [ServicesService],
  controllers: [ServicesController],
  exports: [ServicesService]
})
export class ServicesModule {}
