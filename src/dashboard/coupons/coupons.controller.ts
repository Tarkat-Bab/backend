import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { DashboardCouponsService } from './coupons.service';
import { CreateCouponDto } from 'src/modules/coupons/dtos/create-coupon.dto';
import { UpdateCouponDto } from 'src/modules/coupons/dtos/update-coupon.dto';
import { Language } from 'src/common/decorators/languages-headers.decorator';
import { LanguagesEnum } from 'src/common/enums/lang.enum';

@ApiBearerAuth()
@ApiTags('Dashboard-Coupons')
@Controller('dashboard/coupons')
export class DashboardCouponsController {
    constructor(private readonly dashboardCouponsService: DashboardCouponsService) {}

    @Post()
    @ApiOperation({ summary: 'إنشاء قسيمة جديدة' })
    @ApiHeader({
        name: 'Accept-Language',
        description: 'Language header',
        required: false,
        example: 'ar',
    })
    @ApiResponse({ status: 201, description: 'تم إنشاء القسيمة بنجاح' })
    @ApiResponse({ status: 400, description: 'بيانات غير صالحة' })
    async create(
        @Body() createCouponDto: CreateCouponDto,
        @Language() lang: LanguagesEnum
    ) {
        return this.dashboardCouponsService.create(createCouponDto, lang);
    }

    @Get()
    @ApiOperation({ summary: 'الحصول على جميع القسائم' })
    @ApiHeader({
        name: 'Accept-Language',
        description: 'Language header',
        required: false,
        example: 'ar',
    })
    @ApiResponse({ status: 200, description: 'قائمة القسائم' })
    async findAll(@Language() lang: LanguagesEnum) {
        return this.dashboardCouponsService.findAll(lang);
    }

    @Get(':id')
    @ApiOperation({ summary: 'الحصول على قسيمة محددة' })
    @ApiHeader({
        name: 'Accept-Language',
        description: 'Language header',
        required: false,
        example: 'ar',
    })
    @ApiResponse({ status: 200, description: 'تفاصيل القسيمة' })
    @ApiResponse({ status: 404, description: 'القسيمة غير موجودة' })
    async findOne(
        @Param('id', ParseIntPipe) id: number,
        @Language() lang: LanguagesEnum
    ) {
        return this.dashboardCouponsService.findOne(id, lang);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'تحديث قسيمة' })
    @ApiHeader({
        name: 'Accept-Language',
        description: 'Language header',
        required: false,
        example: 'ar',
    })
    @ApiResponse({ status: 200, description: 'تم تحديث القسيمة بنجاح' })
    @ApiResponse({ status: 404, description: 'القسيمة غير موجودة' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateCouponDto: UpdateCouponDto,
        @Language() lang: LanguagesEnum
    ) {
        return this.dashboardCouponsService.update(id, updateCouponDto, lang);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'حذف قسيمة' })
    @ApiHeader({
        name: 'Accept-Language',
        description: 'Language header',
        required: false,
        example: 'ar',
    })
    @ApiResponse({ status: 200, description: 'تم حذف القسيمة بنجاح' })
    @ApiResponse({ status: 404, description: 'القسيمة غير موجودة' })
    async remove(
        @Param('id', ParseIntPipe) id: number,
        @Language() lang: LanguagesEnum
    ) {
        await this.dashboardCouponsService.remove(id, lang);
        return { 
            message: lang === LanguagesEnum.ARABIC 
                ? 'تم حذف القسيمة بنجاح' 
                : 'Coupon deleted successfully' 
        };
    }
}
