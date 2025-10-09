import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { UsersTypes } from 'src/common/enums/users.enum';
import { CreateLocationDto } from 'src/modules/locations/createLocation.dto';

export class RegisterDto {
  @ApiProperty({
    required: true,
    description: 'Type of user to register',
    enum: UsersTypes,
    enumName: 'UsersTypes',
    type: String,
    example: UsersTypes.USER,
  })
  @IsNotEmpty()
  @IsEnum(UsersTypes, { message: 'Type must be one of: user, admin, or technical' })
  type: UsersTypes;

  @ApiProperty({
    required: true,
    description: 'User phone number (international format)',
    type: String,
    example: '+966501234567',
  })
  @IsNotEmpty()
  @IsString()
  @IsPhoneNumber(null, { message: 'Please provide a valid phone number in international format' })
  phone: string;
}

export class UserRegisterDto {
    @ApiProperty({
    required: true,
    description: 'User phone number (international format)',
    type: String,
    example: '+966501234567',
  })
  @IsNotEmpty()
  @IsString()
  @IsPhoneNumber(null, { message: 'Please provide a valid phone number in international format' })
  phone: string;
  
  @ApiProperty({
    required: true,
    description: 'Full username',
    type: String,
    example: 'Ahmed Ali',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  username: string;

  @ApiProperty({
    required: false,
    description: 'User Location (Latitude, Longitude)',
    type: CreateLocationDto
  })
  @IsOptional()
  // @ValidateNested()
  @Type(() => CreateLocationDto)
  location?: CreateLocationDto;

  @ApiProperty({
    required: true,
    description: 'User Type (e.g , user, technical)',
    type: String,
    enum: [UsersTypes.USER, UsersTypes.TECHNICAL],
    example: UsersTypes.USER,
  })
  @IsNotEmpty()
  @IsString()
  @IsEnum([UsersTypes.USER, UsersTypes.TECHNICAL])
  type: UsersTypes;

  @ApiProperty({
    required: false,
    description: 'Profile image',
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  image?: Express.Multer.File;
}

export class TechnicalRegisterDto extends UserRegisterDto {
  @ApiProperty({
    required: true,
    description: 'Selected service ID',
    type: Number,
    example: 1
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  serviceId: number;

  @ApiProperty({
    required: true,
    description: 'Nationality ID',
    type: Number,
    example: 1
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  nationalityId: number;

  @ApiProperty({
    required: false,
    description: 'Work license image',
    type: 'string',
    format: 'binary'
  })
  @IsOptional()
  workLicenseImage?: Express.Multer.File;

  @ApiProperty({
    required: false,
    description: 'Identity/ID card image',
    type: 'string',
    format: 'binary'
  })
  @IsOptional()
  identityImage?: Express.Multer.File;
}