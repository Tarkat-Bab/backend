import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateCityDto {
  @ApiProperty({ example: 'الدرعية', description: 'اسم المدينة ' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 24.744, description: 'خط العرض (Latitude)' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 46.535, description: 'خط الطول (Longitude)' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ example: 1, description: 'معرّف المنطقة التي تتبعها المدينة' })
  @IsNumber()
  regionId: number;
}

export class UpdateCityDto {
  @ApiPropertyOptional({ example: 'الدرعية', description: 'اسم المدينة بالعربية' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 24.744, description: 'خط العرض (Latitude)' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 46.535, description: 'خط الطول (Longitude)' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 1, description: 'معرّف المنطقة الجديدة (اختياري للتحديث)' })
  @IsOptional()
  @IsNumber()
  regionId?: number;
}
