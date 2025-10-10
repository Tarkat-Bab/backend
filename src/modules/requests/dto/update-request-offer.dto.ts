import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateRequestOfferDto {
  @ApiProperty({ description: 'Price offered for the request', required: false })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({ description: 'Whether delivery is needed', required: false })
  @IsOptional()
  @IsBoolean()
  needsDelivery?: boolean;

  @ApiProperty({ description: 'Description of the offer', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Latitude of the technician location', required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ description: 'Longitude of the technician location', required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ description: 'Address in Arabic', required: false })
  @IsOptional()
  @IsString()
  arAddress?: string;

  @ApiProperty({ description: 'Address in English', required: false })
  @IsOptional()
  @IsString()
  enAddress?: string;
}
