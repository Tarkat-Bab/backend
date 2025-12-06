import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFirstOrderDiscountDto {
    @ApiProperty({ example: 10, description: 'Discount percentage (0-100)' })
    @IsNumber()
    @Min(0)
    @Max(100)
    discountPercentage: number;

    @ApiProperty({ example: 50, description: 'Maximum discount amount in SAR' })
    @IsNumber()
    @Min(0)
    maxDiscountAmount: number;
}
