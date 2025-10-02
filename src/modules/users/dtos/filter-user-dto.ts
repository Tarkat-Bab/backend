import { ApiProperty } from '@nestjs/swagger';
import { PaginatorInput } from '../../../common/paginator/types/paginate.input';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { OrderStatus } from '../../../common/enums/orders.enum';
import { UsersTypes } from 'src/common/enums/users.enum';

enum UsersSortOptions {
  createdAt = 'createdAt',
  lastLoginAt = 'lastLoginAt',
}

export class FilterUsersDto extends PaginatorInput {
  @ApiProperty({
    description: 'User Type',
    type: String,
    enum: UsersTypes,
    example: UsersTypes.USER,
    required: false,
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @IsEnum(UsersTypes)
  type: UsersTypes;

  @ApiProperty({
    description: 'phone number',
    type: String,
    example: '123456789',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  phone: string;

  @ApiProperty({
    description: 'email',
    type: String,
    example: 'example@gmail.com',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  email: string;

  @ApiProperty({
    description: 'user status',
    type: Boolean,
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  active: boolean;

  @ApiProperty({
    required: false,
    enum: OrderStatus,
    description: 'Order of sorting',
    default: OrderStatus.DESC,
  })
  @IsEnum(OrderStatus)
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  sortOrder: OrderStatus = OrderStatus.DESC;

  @ApiProperty({
    required: false,
    enum: UsersSortOptions,
    description: 'Field to sort by',
    default: UsersSortOptions.createdAt,
  })
  @IsOptional()
  @IsEnum(UsersSortOptions)
  sortBy: string = UsersSortOptions.createdAt;

  @ApiProperty({
    description: 'Created at date in ISO 8601 format (YYYY-MM-DD)',
    example: '2025-03-13',
    type: String,
    format: 'date',
    required: false,
  })
  @IsString()
  @Transform(({ value }) => (value === '' ? null : value.split('T')[0]))
  @IsOptional()
  createdAt: string;

  @ApiProperty({
    description: 'last login at at date in ISO 8601 format (YYYY-MM-DD)',
    example: '2025-03-13',
    type: String,
    format: 'date',
    required: false,
  })
  @IsString()
  @Transform(({ value }) => (value === '' ? null : value.split('T')[0]))
  @IsOptional()
  lastLoginAt: string;
}