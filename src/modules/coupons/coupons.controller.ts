import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { UpdateFirstOrderDiscountDto } from './dtos/update-first-order-discount.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('first-order-discount')
@Controller('first-order-discount')
export class CouponsController {
    constructor(private readonly couponsService: CouponsService) {}

    @Get('first-order-discount')
    async getFirstOrderDiscount() {
        return this.couponsService.getFirstOrderDiscount();
    }
}
