import { Body, Controller, HttpCode, Patch, Post, Query, Req, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiHeader, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { AuthService }  from '../services/auth.service';
import { isPublic }     from '../../../common/decorators/public.decorator';
import { Language }     from '../../../common/decorators/languages-headers.decorator';

import { verifyEmailOtpDto, verifyPhoneOtpDto } from '../dtos/verify-otp.dto';
import { RegisterDto, TechnicalRegisterDto, UserRegisterDto }  from '../dtos/register.dto';
import { LoginDto }     from '../dtos/login.dto';
import { ForgetPasswordDto } from '../dtos/forgot-password-dto';
import { ResetPasswordDto }  from '../dtos/reset-password.dto';
import { SendEmailOtpDto }        from '../dtos/send-otp-dto';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
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
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto, @Language() lang: LanguagesEnum) {
    return await this.authService.login(loginDto, lang);
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
