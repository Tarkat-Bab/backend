import { Module } from '@nestjs/common';
import { NationaltiesController } from './nationalties.controller';
import { NationaltiesService } from './nationalties.service';

@Module({
  controllers: [NationaltiesController],
  providers: [NationaltiesService]
})
export class NationaltiesModule {}
