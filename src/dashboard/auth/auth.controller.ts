import { Body, Controller, Post } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { Language } from 'src/common/decorators/languages-headers.decorator';
import { isPublic } from 'src/common/decorators/public.decorator';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { ForgetAdminPasswordDto } from 'src/modules/auth/dtos/forgot-password-dto';
import { AdminLoginDto } from 'src/modules/auth/dtos/login.dto';
import { DashboardAuthService } from './auth.service';
import { ResetPasswordDto } from 'src/modules/auth/dtos/reset-password.dto';
import { verifyEmailOtpDto } from 'src/modules/auth/dtos/verify-otp.dto';
import { SendEmailOtpDto } from 'src/modules/auth/dtos/send-otp-dto';
@isPublic()
@ApiTags('Dashboard')
@Controller('dashboard/auth')
export class DashboardAuthController {
    constructor(
        private readonly authService: DashboardAuthService
    ) {}

    @Post('login')
    @ApiHeader({
       name: 'Accept-Language',
       description: 'Language for the response (e.g., ar, en)',
       required: false,
    })
    async login(
        @Body() adminLogin: AdminLoginDto,
        @Language() lang: LanguagesEnum
    ) {
        return await this.authService.login(adminLogin, lang);
    }

    @Post('forgot-password')
    @ApiHeader({
       name: 'Accept-Language',
         description: 'Language for the response (e.g., ar, en)',
         required: false,
    })
    async forgotPassword(
        @Body() forgotPasswordDto: ForgetAdminPasswordDto,
        @Language() lang: LanguagesEnum
    ) {
        return await this.authService.forgotAdminPassword(forgotPasswordDto, lang);
    }

    @Post('verify-otp')
    @ApiHeader({
       name: 'Accept-Language',
        description: 'Language for the response (e.g., ar, en)',
        required: false,
    })
    async verifyOtp(
        @Body() verifyOtpDto: verifyEmailOtpDto,
        @Language() lang: LanguagesEnum
    ) {
        return await this.authService.verifyOtp(verifyOtpDto, lang);
    }

    @Post('reset-password')
    @ApiHeader({
       name: 'Accept-Language',
        description: 'Language for the response (e.g., ar, en)',
        required: false,
    })
    async resetPassword(
        @Body() resetPass: ResetPasswordDto,
        @Language() lang: LanguagesEnum 
    ) {
        return await this.authService.resetPassword(resetPass, lang);
    }

    @Post('resend-code')
      @ApiHeader({
        name: 'Accept-Language',
        description: 'Language for the response (e.g., ar, en)',
        required: false
      })
      async resendOtp(
        @Body() resendOtp: SendEmailOtpDto,
        @Language() lang: LanguagesEnum,
      ){
        return await this.authService.resendOtp(resendOtp, lang);
      }
}
