import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import * as crypto from 'crypto';

import { OtpPurpose     } from '../enums/otp.purpose.enum';
import { EmailService   } from '../../../modules/mailer/mailer.service';
import { CachedOtpType  } from '../types/cached-otp.interface';
import { verifyEmailOtpDto   } from '../dtos/verify-otp.dto';
import { userDetailsDto } from '../dtos/user-details-dto';
import { LanguagesEnum } from 'src/common/enums/lang.enum';

@Injectable()
export class OtpService {
  private readonly OTP_DIGITS = 6;
  private readonly OTP_EXPIRATION_MS = 2 * 60 * 1000; // 2 minutes
  private readonly DEV_OTP_CODE = '123456';

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly mailService: EmailService,
  ) {}

  /**
   * Generate and send OTP to user by email
   */
  async sendOtp(userDetails: userDetailsDto, purpose: OtpPurpose, lang?: LanguagesEnum): Promise<string> {
    const code =
      process.env.NODE_ENV === 'development'
        ? this.DEV_OTP_CODE
        : this.generateCode();

    const key = this.buildCacheKey(
      userDetails.email, purpose);
    await this.cacheManager.set<CachedOtpType>(
      key,
      { userDetails, otp: code },
      this.OTP_EXPIRATION_MS,
    );

    console.log(`OTP cache key: ${key}, Send OTP Function`);
    // send purpose-based email
    await this.sendOtpEmail(userDetails, code, purpose, lang);
    return code;
  }

  /**
   * Verify OTP entered by the user
   */
  async verifyEmailOtp( verifyEmailOtpDto: verifyEmailOtpDto, lang?: LanguagesEnum): Promise<boolean> {
    const key = this.buildCacheKey(verifyEmailOtpDto.email, verifyEmailOtpDto.purpose);
    console.log(`OTP cache key: ${key}, Verify OTP Function`);

    const payload = await this.cacheManager.get<CachedOtpType>(key);
    
    if (!payload) {
      if (lang === LanguagesEnum.ARABIC) {
        throw new BadRequestException('انتهت صلاحية رمز التحقق OTP.');
      }

      throw new BadRequestException('OTP is expired.');
    }
  
    if (payload.otp !== verifyEmailOtpDto.otp) {
      if (lang === LanguagesEnum.ARABIC) {
        throw new BadRequestException('رمز التحقق OTP غير صالح.');
      }
      throw new BadRequestException('Invalid OTP.');
    }
    return true;
  }

  /**
   * Clear the cache
   */
  async clearCache(email: string, purpose: OtpPurpose){
    const key = this.buildCacheKey(email, purpose);
    await this.cacheManager.del(key);
  }

  /**
   * Generate random numeric OTP
   */
  private generateCode(): string {
    const max = Math.pow(10, this.OTP_DIGITS);
    const otp = crypto.randomInt(0, max);
    return otp.toString().padStart(this.OTP_DIGITS, '0');
  }

  /**
   * Build unique cache key
   */
  private buildCacheKey(email: string, purpose: OtpPurpose): string {
    return `OTP:${purpose}:${email}`;
  }

  /**
   * Send OTP email depending on purpose
   */
  private async sendOtpEmail(
    { email, name }: userDetailsDto,
    code: string,
    purpose: OtpPurpose,
    lang?: string,
  ): Promise<void> {
    const templates = {
      [OtpPurpose.Register]: {
        template: 'registration',
        subject: 'Registration Verification',
        context: { email, code, name, lang },
      },

      [OtpPurpose.forgetPassword]: {
        template: 'forgot-pass',
        subject:  'Reset Password',
        context: { email, code, name, lang },
      },


    };

    const mailConfig = templates[purpose];
    if (!mailConfig) {
      throw new BadRequestException(`Unsupported OTP purpose: ${purpose}`);
    }

    await this.mailService.sendEmail(
      email,
      mailConfig.template,
      mailConfig.context,
      mailConfig.subject,
    );
  }

}
