import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateSettingDto {

  @ApiPropertyOptional({
    description: 'Client commission percentage',
    example: 10.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  clientPercentage?: number;

  @ApiPropertyOptional({
    description: 'Tax percentage applied to all transactions',
    example: 15.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxPercentage?: number;

  @ApiPropertyOptional({
    description: 'Technician commission percentage',
    example: 20.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  technicianPercentage?: number;

  @ApiPropertyOptional({
    description: 'Maximum discount allowed for the client',
    example: 30.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  clientMaxDiscount?: number;

  @ApiPropertyOptional({
    description: 'Maximum discount allowed for the technician',
    example: 25.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  technicianMaxDiscount?: number;
}
