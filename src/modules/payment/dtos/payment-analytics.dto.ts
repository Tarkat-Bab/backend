import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum PeriodEnum {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
  CUSTOM = 'custom'
}

export class PaymentAnalyticsDto {
  @ApiProperty({ 
    enum: PeriodEnum, 
    required: false,
    example: PeriodEnum.MONTH,
    description: 'Period for analytics'
  })
  @IsOptional()
  @IsEnum(PeriodEnum)
  period?: PeriodEnum;

  @ApiProperty({ 
    required: false,
    example: '2024-01-01',
    description: 'Start date for custom period (YYYY-MM-DD)'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ 
    required: false,
    example: '2024-12-31',
    description: 'End date for custom period (YYYY-MM-DD)'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
