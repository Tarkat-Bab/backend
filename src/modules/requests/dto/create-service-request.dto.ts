import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateServiceRequestDto {
  @ApiProperty({ description: 'Title of the service request' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Description of the service request' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'Latitude of the request location' })
  @IsNotEmpty()
  @IsString()
  latitude: string;

  @ApiProperty({ description: 'Longitude of the request location' })
  @IsNotEmpty()
  @IsString()
  longitude: string;

  @ApiProperty({ description: 'Address in Arabic' })
  @IsNotEmpty()
  @IsString()
  arAddress: string;

  @ApiProperty({ description: 'Address in English' })
  @IsNotEmpty()
  @IsString()
  enAddress: string;

  @ApiProperty({ description: 'Price for the service request' })
  @IsNotEmpty()
  @IsNumber()
  price: number;
}
