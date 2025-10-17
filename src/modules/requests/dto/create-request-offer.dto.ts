import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { CreateLocationDto } from 'src/modules/locations/createLocation.dto';

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

  @ApiProperty({
    required: false,
    description: 'Request Location (Latitude, Longitude, Address.)',
    type: CreateLocationDto
  })
  @IsOptional()
  @Type(() => CreateLocationDto)
  location?: CreateLocationDto;

  @ApiProperty({ description: 'ID of the request' })
  @IsNotEmpty()
  @IsNumber()
  requestId: number;

  @ApiProperty({ description: 'ID of the technical user making the offer' })
  @IsNotEmpty()
  @IsNumber()
  technicianId: number;
}
