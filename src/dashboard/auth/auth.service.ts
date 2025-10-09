import { Injectable } from '@nestjs/common';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { ForgetAdminPasswordDto } from 'src/modules/auth/dtos/forgot-password-dto';
import { AdminLoginDto } from 'src/modules/auth/dtos/login.dto';
import { ResetPasswordDto } from 'src/modules/auth/dtos/reset-password.dto';
import { SendEmailOtpDto } from 'src/modules/auth/dtos/send-otp-dto';
import { verifyEmailOtpDto } from 'src/modules/auth/dtos/verify-otp.dto';
import { AuthService } from 'src/modules/auth/services/auth.service';

@Injectable()
export class DashboardAuthService {
    constructor(
        private readonly authService: AuthService,
    ){}

    async login(loginDto: AdminLoginDto, lang: LanguagesEnum) {
        return await this.authService.adminLogin(loginDto, lang);
    }

    async forgotAdminPassword(forgetPasswordDto: ForgetAdminPasswordDto, lang: LanguagesEnum) {
        return await this.authService.forgetAdminPassword(forgetPasswordDto, lang);
    }

    async verifyOtp(verifyOtpDto: verifyEmailOtpDto, lang: LanguagesEnum) {
        return await this.authService.verifyEmailOtp(verifyOtpDto, lang);
    }

    async resetPassword(resetPass: ResetPasswordDto, lang: LanguagesEnum) {
        return await this.authService.resetPassword(resetPass, lang);
    }

    async resendOtp(sendEmailOtpDto: SendEmailOtpDto, lang?: LanguagesEnum) {
        return await this.authService.resendOtp(sendEmailOtpDto, lang);
    }
}
