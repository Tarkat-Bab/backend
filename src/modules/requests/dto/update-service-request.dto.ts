import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { RequestStatus } from '../enums/requestStatus.enum';

export class UpdateServiceRequestDto {
  @ApiProperty({ description: 'Title of the service request', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Description of the service request', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Latitude of the request location', required: false })
  @IsOptional()
  @IsString()
  latitude?: string;

  @ApiProperty({ description: 'Longitude of the request location', required: false })
  @IsOptional()
  @IsString()
  longitude?: string;

  @ApiProperty({ description: 'Address in Arabic', required: false })
  @IsOptional()
  @IsString()
  arAddress?: string;

  @ApiProperty({ description: 'Address in English', required: false })
  @IsOptional()
  @IsString()
  enAddress?: string;

  @ApiProperty({ description: 'Status of the service request', required: false, enum: RequestStatus })
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @ApiProperty({ description: 'Price for the service request', required: false })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({ description: 'Technician ID assigned to the request', required: false })
  @IsOptional()
  @IsNumber()
  technicianId?: number;
}
