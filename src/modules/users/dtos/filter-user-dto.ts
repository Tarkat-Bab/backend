import { ApiProperty } from '@nestjs/swagger';
import { PaginatorInput } from '../../../common/paginator/types/paginate.input';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { OrderStatus } from '../../../common/enums/orders.enum';
import { UsersTypes } from 'src/common/enums/users.enum';

export class FilterUsersDto extends PaginatorInput {
  @ApiProperty({
    description: 'User Type',
    type: String,
    enum: UsersTypes,
    example: UsersTypes.USER,
    required: true,
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
}