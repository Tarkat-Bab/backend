import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateRequestOfferDto {
  @ApiProperty({ description: 'Price offered for the request' })
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiProperty({ description: 'Whether delivery is needed', default: false })
  @IsOptional()
  @IsBoolean()
  needsDelivery?: boolean;

  @ApiProperty({ description: 'Description of the offer' })
  @IsNotEmpty()
  @IsString()
  description: string;

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

  @ApiProperty({ description: 'ID of the request' })
  @IsNotEmpty()
  @IsNumber()
  requestId: number;

  @ApiProperty({ description: 'ID of the technical user making the offer' })
  @IsNotEmpty()
  @IsNumber()
  technicianId: number;
}
