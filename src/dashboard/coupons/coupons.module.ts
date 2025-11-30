import { Module } from '@nestjs/common';
import { CouponsModule } from 'src/modules/coupons/coupons.module';
import { DashboardCouponsController } from './coupons.controller';
import { DashboardCouponsService } from './coupons.service';

@Module({
  imports: [CouponsModule],
  controllers: [DashboardCouponsController],
  providers: [DashboardCouponsService],
  exports: [DashboardCouponsService]
})
export class DashboardCouponsModule {}
