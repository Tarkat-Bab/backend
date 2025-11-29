import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { LanguagesEnum } from 'src/common/enums/lang.enum';

export class UpdateFcmTokenDto {
  @ApiProperty({
    description: 'Firebase Cloud Messaging token',
    example: 'dGhpc2lzYXNhbXBsZXRva2Vu...',
  })
  @IsString()
  @IsNotEmpty()
  fcmToken: string;

  @ApiProperty({
    description: 'User preferred language',
    enum: LanguagesEnum,
    example: LanguagesEnum.ENGLISH,
  })
  @IsEnum(LanguagesEnum)
  @IsNotEmpty()
  usedLanguage: LanguagesEnum;
}
