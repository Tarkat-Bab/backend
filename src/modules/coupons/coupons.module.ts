import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponEntity } from './entities/coupons.entity';
import { FirstOrderDiscountEntity } from './entities/first-order-discount.entity';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([CouponEntity, FirstOrderDiscountEntity])
    ],
    controllers: [CouponsController],
    providers: [CouponsService],
    exports: [CouponsService]
})
export class CouponsModule {}
