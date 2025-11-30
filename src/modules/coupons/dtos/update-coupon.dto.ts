// update-coupon.dto.ts
import { IsString, IsNumber, IsDateString, IsBoolean, IsOptional, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCouponDto {
  @ApiPropertyOptional({
    description: 'رمز القسيمة الفريد (اختياري)',
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
  @IsOptional()
  discountPercentage?: number;

  @ApiPropertyOptional({
    description: 'الحد الأقصى لمبلغ الخصم',
    example: 50,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxDiscountAmount?: number;

  @ApiPropertyOptional({
    description: 'تاريخ بداية صلاحية القسيمة',
    example: '2025-06-01',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'تاريخ نهاية صلاحية القسيمة',
    example: '2025-08-31',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'تحديد إذا كانت القسيمة افتراضية',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}