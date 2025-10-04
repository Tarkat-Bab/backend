import { Module } from '@nestjs/common';
import { NationaltiesController } from './nationalties.controller';
import { NationaltiesService } from './nationalties.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NationalityEntity } from './entities/nationality.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([NationalityEntity])
  ],
  controllers: [NationaltiesController],
  providers: [NationaltiesService],
  exports: [NationaltiesService]
})
export class NationaltiesModule {}
