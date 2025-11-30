import { Injectable } from '@nestjs/common';
import { CouponsService } from 'src/modules/coupons/coupons.service';
import { CreateCouponDto } from 'src/modules/coupons/dtos/create-coupon.dto';
import { UpdateCouponDto } from 'src/modules/coupons/dtos/update-coupon.dto';
import { UpdateFirstOrderDiscountDto } from 'src/modules/coupons/dtos/update-first-order-discount.dto';
import { LanguagesEnum } from 'src/common/enums/lang.enum';

@Injectable()
export class DashboardCouponsService {
  constructor(
    private couponService: CouponsService
  ) {}

  async create(createCouponDto: CreateCouponDto, lang: LanguagesEnum){
      return await this.couponService.create(createCouponDto, lang);
  }

  async findAll(lang: LanguagesEnum){
    return await this.couponService.findAll(lang);
  }

  async findOne(id: number, lang: LanguagesEnum){
    return await this.couponService.findOne(id, lang);
  }

  async update(id: number, updateCouponDto: UpdateCouponDto, lang: LanguagesEnum){
    return await this.couponService.update(id, updateCouponDto, lang);
  }

  async remove(id: number, lang: LanguagesEnum): Promise<void> {
    return await this.couponService.remove(id, lang);
  }

  async getFirstOrderDiscount() {
    return await this.couponService.getFirstOrderDiscount();
  }

  async updateFirstOrderDiscount(updateDto: UpdateFirstOrderDiscountDto) {
    return await this.couponService.updateFirstOrderDiscount(updateDto);
  }

}
