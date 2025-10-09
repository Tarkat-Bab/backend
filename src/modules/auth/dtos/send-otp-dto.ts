import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { OtpPurpose } from '../enums/otp.purpose.enum';

export class SendEmailOtpDto{
    @ApiProperty({
        description: 'user email',
        type: String,
        example: 'user@gmail.com',
    })
    @IsNotEmpty()
    @IsEmail()
    email: string;
    
    
  @ApiProperty({
    enum: OtpPurpose,
    example: OtpPurpose.forgetPassword,
    description: 'otp purpose',
  })
  @IsEnum(OtpPurpose)
  @IsNotEmpty()
  purpose: OtpPurpose;
}