import { ApiProperty } from '@nestjs/swagger';
import {  IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { SendEmailOtpDto } from './send-otp-dto';
import { OtpPurpose } from '../enums/otp.purpose.enum';
import { Transform } from 'class-transformer';

export class verifyEmailOtpDto extends SendEmailOtpDto{
  @ApiProperty({
    required: true,
    description: 'otp code',
    example: '123456',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  otp: string;

  @ApiProperty({
    required: true,
    description: 'otp purpose',
    example: OtpPurpose.Register,
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  purpose: OtpPurpose;
}

export class verifyPhoneOtpDto {
  @ApiProperty({
    required: true,
    description: 'phone number',
    example: '+966501234567',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({
    required: true,
    description: 'otp code',
    example: '12345',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  otp: string;

  @ApiProperty({
    required: true,
    description: 'otp purpose', 
    example: OtpPurpose.Register,
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  purpose: OtpPurpose;

  
  @ApiProperty({
    required: false,
    description: 'Indicates if the user is new or existing',
    type: Boolean,
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  newUser?: boolean; 
}
