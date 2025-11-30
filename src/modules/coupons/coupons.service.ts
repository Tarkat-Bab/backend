import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CouponEntity } from './entities/coupons.entity';
import { CreateCouponDto } from './dtos/create-coupon.dto';
import { UpdateCouponDto } from './dtos/update-coupon.dto';
import { LanguagesEnum } from 'src/common/enums/lang.enum';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(CouponEntity)
    private couponRepo: Repository<CouponEntity>,
  ) {}

  

    async create(createCouponDto: CreateCouponDto, lang: LanguagesEnum): Promise<CouponEntity> {
      if (createCouponDto.isDefault) {
        // make sure only one default coupon exists
        await this.couponRepo.update({ isDefault: true }, { isDefault: false });
      }

      const coupon = this.couponRepo.create({
        ...createCouponDto,
        code: createCouponDto.code || this.generateCouponCode(),
      });

      return this.couponRepo.save(coupon);
    }


  findAll(lang: LanguagesEnum): Promise<CouponEntity[]> {
    return this.couponRepo.find();
  }

  async findOne(id: number, lang: LanguagesEnum): Promise<CouponEntity> {
    const coupon = await this.couponRepo.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException(
        lang === LanguagesEnum.ARABIC 
          ? 'القسيمة غير موجودة' 
          : 'Coupon not found'
      );
    }
    return coupon;
  }

  async update(id: number, updateCouponDto: UpdateCouponDto, lang: LanguagesEnum): Promise<CouponEntity> {
    const coupon = await this.findOne(id, lang);

    if (updateCouponDto.isDefault) {
      await this.couponRepo.update({ isDefault: true }, { isDefault: false });
    }

    // If code is provided, use it; otherwise keep the existing code
    if (updateCouponDto.code) {
      coupon.code = updateCouponDto.code;
    }

    Object.assign(coupon, updateCouponDto);
    return this.couponRepo.save(coupon);
  }

  async remove(id: number, lang: LanguagesEnum): Promise<void> {
    const coupon = await this.findOne(id, lang);
    await this.couponRepo.remove(coupon);
  }

  generateCouponCode(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
