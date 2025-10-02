/**
 * This DTO for creating Moderators and Admins
 */
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsEnum,
} from 'class-validator';
import { UsersTypes } from 'src/common/enums/users.enum';
import { CreateLocationDto } from 'src/modules/locations/createLocation.dto';

export class CreateUserDto {
  @ApiProperty({
    required: true,
    description: 'Full name',
    type: String,
    example: 'Ahmed',
  })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({
    required: true,
    description: 'Student phone',
    type: String,
    example: '01098765432',
  })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({
    required: true,
    description: 'User email',
    type: String,
    example: 'user@test.com',
  })
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @ApiProperty({
    required: true,
    description: 'User Location (Latitude, Longitude)',
    type: CreateLocationDto

  })
  @IsNotEmpty()
  location: CreateLocationDto;

  @ApiProperty({
    required: true,
    description: 'User Type',
    type: String,
    enum: UsersTypes,
    example: UsersTypes.USER,
  })
  @IsEnum(UsersTypes)
  type: UsersTypes;
}
