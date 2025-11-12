import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';
import { PaginatorInput } from 'src/common/paginator/types/paginate.input';

export class CreateRegionDto {
  @ApiProperty({ example: 'الرياض', description: 'name of region with any lang' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 24.7136, description: 'Latitude' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 46.6753, description: 'Longitude' })
  @IsOptional()
  @IsOptional()

  @IsNumber()
  longitude?: number; 
}

export class UpdateRegionDto {
  @ApiPropertyOptional({ example: 'الرياض', description: 'name of region with any lang' })
  @IsString()
  @IsOptional()
  name: string;

  @ApiPropertyOptional({ example: 24.7136, description: 'Latitude' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 46.6753, description: 'Longitude' })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}


export class FilterRegionDto extends PaginatorInput {
    @ApiPropertyOptional({ example: "المجمعة", description: 'search by city or Region name' })
    @IsString()
    @IsOptional()
    search?: string;
}