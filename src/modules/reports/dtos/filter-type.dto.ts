import { ApiProperty } from '@nestjs/swagger';
import { PaginatorInput } from '../../../common/paginator/types/paginate.input';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { UsersTypes } from 'src/common/enums/users.enum';

export class FilterReportsDto extends PaginatorInput {
  @ApiProperty({
    description: 'Reporters Type',
    type: String,
    enum: [ UsersTypes.USER, UsersTypes.TECHNICAL ],
    example: UsersTypes.USER,
    required: true,
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @IsEnum(UsersTypes)
  type: UsersTypes;

}