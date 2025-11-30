// create-coupon.dto.ts
import { IsString, IsNumber, IsDateString, IsBoolean, IsOptional, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCouponDto {
  @ApiPropertyOptional({
    description: 'رمز القسيمة الفريد (اختياري - سيتم توليده تلقائياً إذا لم يتم تقديمه)',
    example: 'WELCOME10',
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({
    description: 'نسبة الخصم بالنسبة المئوية',
    example: 10,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage: number;

  @ApiPropertyOptional({
    description: 'الحد الأقصى لمبلغ الخصم بالدولار',
    example: 50,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  maxDiscountAmount: number;

  @ApiPropertyOptional({
    description: 'تاريخ بداية صلاحية القسيمة',
    example: '2025-06-01',
  })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({
    description: 'تاريخ نهاية صلاحية القسيمة',
    example: '2025-08-31',
  })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    description: 'تحديد إذا كانت القسيمة افتراضية للطلب الأول',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
