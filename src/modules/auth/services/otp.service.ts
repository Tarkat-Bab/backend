import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import * as crypto from 'crypto';
import axios from 'axios';

import { OtpPurpose     } from '../enums/otp.purpose.enum';
import { EmailService   } from '../../../modules/mailer/mailer.service';
import { CachedOtpType  } from '../types/cached-otp.interface';
import { verifyEmailOtpDto, verifyPhoneOtpDto   } from '../dtos/verify-otp.dto';
import { userDetailsDto } from '../dtos/user-details-dto';
import { LanguagesEnum } from 'src/common/enums/lang.enum';

@Injectable()
export class OtpService {
  private readonly OTP_DIGITS = 5;
  private readonly OTP_EXPIRATION_MS = 2 * 60 * 1000; // 2 minutes
  private readonly DEV_OTP_CODE = '12345';

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly mailService: EmailService,
  ) {}

  /**
   * Generate and send OTP to user by email
   */
  async sendOtp(userDetails: userDetailsDto, purpose: OtpPurpose, lang?: LanguagesEnum): Promise<string> {
    const code = this.generateCode();
    const key = this.buildCacheKey(userDetails.email, purpose);
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

  async sendPhoneOtp(recipientPhone: string, purpose: OtpPurpose, lang?: LanguagesEnum, test?:boolean){
    const code = test? this.DEV_OTP_CODE : this.generateCode();
    const otpKey = this.buildCacheKey(recipientPhone, purpose);
    const rateKey = `otp_rate:${recipientPhone}:${purpose}`;
    const rateData = await this.cacheManager.get<{ count: number; lastSent: number }>(rateKey);
    const now = Date.now();
    
    if (rateData) {
      if (rateData.count >= 5) {
       throw new BadRequestException(
        lang == LanguagesEnum.ENGLISH ? 
         "You have reached the maximum OTP attempts.":
          "لقد تخطيت الحد الاقصي من ارسال كود التحقق."
        );
      }

      const diff = (now - rateData.lastSent) / 1000;
        if (diff < 30) {
          throw new BadRequestException(
            lang === LanguagesEnum.ARABIC ?
              'يجب الانتظار 30 ثانية قبل طلب رمز تحقق جديد' :
              'Please wait 30 seconds before requesting another OTP'
          );
      }
    }

    await this.cacheManager.set<CachedOtpType>(
      otpKey,
      { userDetails: { phone: recipientPhone }, otp: code },
      this.OTP_EXPIRATION_MS,
    );

     const newRate = {
      count: rateData ? rateData.count + 1 : 1,
      lastSent: now,
    };

  await this.cacheManager.set(rateKey, newRate, 3600 * 1000);


    console.log(`Sending OTP with test: `, test)
    if(test) return code; 

    const headers = {
      "Authorization": `Bearer ${process.env.OTP_TOKEN}`,
      "Content-Type": "application/json"
    };
    const senderName = recipientPhone.startsWith("+20") ? "TarqatBab" : "Tarqat-B";
    const body = lang === LanguagesEnum.ARABIC ?
     `رمز التحقق الخاص بك لتسجيل الدخول لتطبيق طرقة باب: ${code}`:
     `Your verification code to login at ${senderName} application: ${code}`;

    const payload = {
      auth: process.env.OTP_TOKEN,
      recipients: [recipientPhone],
      sender: senderName,
      body
    };

   axios.post(process.env.OTP_URL, payload, { headers })
    .then(response => {
    console.log("Status Code:", response.status);
    console.log("Response Body:", response.data);
   })
      .catch(error => {
       console.error("Error:", error.response ? error.response.data : error.message);
  });

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

   async verifyPhoneOtp(verifyPhoneOtpDto: verifyPhoneOtpDto, lang?: LanguagesEnum): Promise<boolean> {
    const key = this.buildCacheKey(verifyPhoneOtpDto.phone, verifyPhoneOtpDto.purpose);
    console.log(`OTP cache key: ${key}, Verify OTP Function`);

    const payload = await this.cacheManager.get<CachedOtpType>(key);
    
    if (!payload) {
      if (lang === LanguagesEnum.ARABIC) {
        throw new BadRequestException('انتهت صلاحية رمز التحقق OTP.');
      }

      throw new BadRequestException('OTP is expired.');
    }
  
    if (payload.otp !== verifyPhoneOtpDto.otp) {
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
   * Send OTP email dePENDING on purpose
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
