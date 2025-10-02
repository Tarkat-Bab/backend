import { ApiProperty } from '@nestjs/swagger';
import {  IsNotEmpty, IsString } from 'class-validator';
import { SendEmailOtpDto } from './send-otp-dto';

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
}
