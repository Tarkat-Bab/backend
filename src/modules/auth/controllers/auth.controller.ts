import { Body, Controller, HttpCode, Patch, Post, Query, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { ApiConsumes, ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';

import { AuthService }  from '../services/auth.service';
import { isPublic }     from '../../../common/decorators/public.decorator';
import { Language }     from '../../../common/decorators/languages-headers.decorator';

import { verifyPhoneOtpDto } from '../dtos/verify-otp.dto';
import { TechnicalRegisterDto, UserRegisterDto }  from '../dtos/register.dto';
import { LoginDto }     from '../dtos/login.dto';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { imageFilter } from 'src/common/files/files.filter';

@ApiTags('auth')
@isPublic()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  @ApiHeader({
    name: 'Accept-Language',
    description: 'Language for the response (e.g., ar, en)',
    required: false,
  })
  @ApiQuery({
    name: 'test',
    description: 'Is test mode',
    type: Boolean,
    required: false,
    example: false
  })
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto, @Language() lang: LanguagesEnum, @Query('test') test?: string) {
    const isTest = test === 'true';
    return await this.authService.login(loginDto, lang, isTest);
  }


  @Post('verify-otp')
    @ApiHeader({
       name: 'Accept-Language',
        description: 'Language for the response (e.g., ar, en)',
        required: false,
    })
    async verifyOtp(
        @Body() verifyOtpDto: verifyPhoneOtpDto,
        @Language() lang: LanguagesEnum
    ) {
        return await this.authService.verifyPhoneOtp(verifyOtpDto, lang);
    }



  @Patch('/complete-user')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', { fileFilter: imageFilter }))
  @ApiHeader({
    name: 'Accept-Language',
    description: 'Language for the response (e.g., ar, en)',
    required: false,
  })
  async completeUser(
    @Body() registerDto: UserRegisterDto,
    @Language() lang: LanguagesEnum,
    @UploadedFile() image?: Express.Multer.File
  ) {
    return await this.authService.completeUser(registerDto, lang, image);
  }
  
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'image', maxCount: 1 },
    { name: 'workLicenseImage', maxCount: 1 },
    { name: 'identityImage', maxCount: 1 }
  ], { fileFilter: imageFilter }))
  @Patch('/complete-technical')
  @ApiHeader({
    name: 'Accept-Language',
    description: 'Language for the response (e.g., ar, en)',
    required: false,
  })
  async technicalCompleteRegister(
    @Body() registerDto: TechnicalRegisterDto,
    @Language() lang: LanguagesEnum,
    @UploadedFiles() files: {
      image?: Express.Multer.File[],
      workLicenseImage?: Express.Multer.File[],
      identityImage?: Express.Multer.File[]
    }
  ) {
    return await this.authService.technicalCompleteRegister(
      registerDto,
      lang,
      files?.image?.[0],
      files?.workLicenseImage?.[0],
      files?.identityImage?.[0]
    );
  }
}
