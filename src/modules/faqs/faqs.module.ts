import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FaqsService } from './faqs.service';
import { FaqsController } from './faqs.controller';
import { FaqEntity } from './entities/faq.entity';
import { PaginatorModule } from 'src/common/paginator/paginator.module';

@Module({
  imports: [TypeOrmModule.forFeature([FaqEntity]), PaginatorModule],
  controllers: [FaqsController],
  providers: [FaqsService],
  exports: [FaqsService],
})
export class FaqsModule {}
