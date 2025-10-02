import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { UsersTypes } from 'src/common/enums/users.enum';

export class LoginDto {
  @ApiProperty({
    required: true,
    description: 'Email',
    type: String,
    example: 'user@gmail.comn',
  })
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  phone: string;

  @ApiProperty({
    required: false,
    description: 'Firebase token for push notifications',
    type: String,
    example: 'fcm_token'
  })
  @IsString()
  fcm_token?: string;

  @ApiProperty({
    required: true,
    description: 'Type of user logging in',
    enum: [UsersTypes.USER, UsersTypes.TECHNICAL],
    example: UsersTypes.USER,
  })
  @IsString()
  type?: UsersTypes;
}

export class AdminLoginDto {
  @ApiProperty({
    required: true,
    description: 'Email',
    type: String,
    example: 'admin@test.com',
  })
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @ApiProperty({
    required: true,
    description: 'password',
    type: String,
    example: 'StrongPass1!',
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}
