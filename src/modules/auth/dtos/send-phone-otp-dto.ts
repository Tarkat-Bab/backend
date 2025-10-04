import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { OtpPurpose } from '../enums/otp.purpose.enum';

export class SendPhoneOtpDto{
    @ApiProperty({
        description: 'user phone',
        type: String,
        example: '1234567890',
    })
    @IsNotEmpty()
    @IsString()
    phone: string;
}