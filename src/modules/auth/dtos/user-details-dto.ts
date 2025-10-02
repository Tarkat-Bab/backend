import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class userDetailsDto {
  @ApiProperty({
    description: 'user email',
    type: String,
    example: 'user@gmail.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;


  @ApiProperty({
    description: 'user name',
    type: String,
    example: 'Ahmed Mohammed',
  })
  @IsNotEmpty()
  @IsString()
  name: string;
}
