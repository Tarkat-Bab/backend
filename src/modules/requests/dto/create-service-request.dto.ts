import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';
import { CreateLocationDto } from 'src/modules/locations/createLocation.dto';

export class CreateServiceRequestDto {
  @ApiProperty({ description: 'Title of the service request' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Description of the service request' })
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

  @ApiProperty({ description: 'Price for the service request' })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price: number;  

  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' }, description: 'Images for the service request', required: false })
  @IsNotEmpty()
  @IsOptional()
  images?: Express.Multer.File[];

  @ApiProperty({ description: 'ID of the service being requested' })
  @IsNotEmpty()
  @IsNumber()
  // @IsPositive()
  @Type(() => Number)
  serviceId: number;
}
