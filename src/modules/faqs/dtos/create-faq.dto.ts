import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateFaqDto {
  @ApiProperty({ example: 'سؤال شائع بخصوص TarkatBab' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  questionAr: string;

  @ApiProperty({ example: 'Frequently asked question about TarkatBab' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  questionEn: string;

  @ApiProperty({ example: 'الإجابة على السؤال الشائع' })
  @IsString()
  @IsNotEmpty()
  answerAr: string;

  @ApiProperty({ example: 'Answer to the frequently asked question' })
  @IsString()
  @IsNotEmpty()
  answerEn: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
