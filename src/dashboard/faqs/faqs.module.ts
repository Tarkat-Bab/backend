import { Module } from '@nestjs/common';
import { DashboardFaqsService } from './faqs.service';
import { DashboardFaqsController } from './faqs.controller';
import { FaqsModule } from 'src/modules/faqs/faqs.module';

@Module({
  imports: [FaqsModule],
  controllers: [DashboardFaqsController],
  providers: [DashboardFaqsService],
})
export class DashboardFaqsModule {}
