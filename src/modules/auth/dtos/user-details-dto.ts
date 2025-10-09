import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class userDetailsDto {
  @ApiProperty({
    description: 'user email',
    type: String,
    example: 'user@gmail.com',
  })
  @IsNotEmpty()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'user phone',
    type: String,
    example: '+201234567890',
  })
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'user name',
    type: String,
    example: 'Ahmed Mohammed',
  })
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  name?: string;
}
