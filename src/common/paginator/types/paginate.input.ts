import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, Max } from 'class-validator';

export class PaginatorInput {
  @ApiProperty({ required: false, default: 1 })
  @Transform(({ value }) => {
    return Number(value);
  })
  @IsOptional()
  @IsNumber()
  page: number;

  @ApiProperty({ required: false, default: 20 })
  @Transform(({ value }) => {
    return Number(value);
  })
  @IsNumber()
  @Max(100)
  @IsOptional()
  limit: number;
}
