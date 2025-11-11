import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';
import { PaginatorInput } from 'src/common/paginator/types/paginate.input';

export class CreateRegionDto {
  @ApiProperty({ example: 'الرياض', description: 'اسم المنطقة بالعربية' })
  @IsString()
  arName: string;

  @ApiProperty({ example: 'Riyadh', description: 'اسم المنطقة بالإنجليزية' })
  @IsString()
  enName: string;

  @ApiPropertyOptional({ example: 24.7136, description: 'خط العرض (Latitude)' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 46.6753, description: 'خط الطول (Longitude)' })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class UpdateRegionDto {
  @ApiPropertyOptional({ example: 'الرياض', description: 'اسم المنطقة بالعربية' })
  @IsOptional()
  @IsString()
  arName?: string;

  @ApiPropertyOptional({ example: 'Riyadh', description: 'اسم المنطقة بالإنجليزية' })
  @IsOptional()
  @IsString()
  enName?: string;

  @ApiPropertyOptional({ example: 24.7136, description: 'خط العرض (Latitude)' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 46.6753, description: 'خط الطول (Longitude)' })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}


export class FilterRagionDto extends PaginatorInput {
    @ApiPropertyOptional({ example: "المجمعة", description: 'search by citiy or ragion name' })
    @IsString()
    @IsOptional()
    search?: string;
}