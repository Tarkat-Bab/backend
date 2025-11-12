import { ApiProperty } from '@nestjs/swagger';
import { PaginatorInput } from '../../../common/paginator/types/paginate.input';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { OrderStatus } from '../../../common/enums/orders.enum';
import { UsersTypes } from 'src/common/enums/users.enum';

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
    description: 'Search by username',
    type: String,
    example: 'ahmed',
    required: false,
  })
  @IsString()
  @IsOptional()
  username?: string;

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
    description: 'Created at date in ISO 8601 format (YYYY-MM-DD)',
    example: '2025-03-13',
    type: String,
    format: 'date',
    required: false,
  })
  @IsString()
  @Transform(({ value }) => (value === '' ? null : value.split('T')[0]))
  @IsOptional()
  @IsNotEmpty()
  createdAt: string;

  @ApiProperty({
    description: 'Updated at date in ISO 8601 format (YYYY-MM-DD)',
    example: '2025-03-13',
    type: String,
    format: 'date',
    required: false,
  })
  @IsString()
  @Transform(({ value }) => (value === '' ? null : value.split('T')[0]))
  @IsOptional()
  @IsNotEmpty()
  updatedAt: string;
}