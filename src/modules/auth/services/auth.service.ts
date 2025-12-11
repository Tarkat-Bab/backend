import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UserEntity } from '../../../modules/users/entities/users.entity';
import { UsersService } from '../../users/services/users.service';
import { OtpService } from './otp.service';

import { OtpPurpose } from '../enums/otp.purpose.enum';
import { verifyEmailOtpDto, verifyPhoneOtpDto } from '../dtos/verify-otp.dto';
import { TechnicalRegisterDto, UserRegisterDto } from '../dtos/register.dto';
import { AdminLoginDto, LoginDto } from '../dtos/login.dto';
import { SendEmailOtpDto } from '../dtos/send-otp-dto';
import { ForgetAdminPasswordDto } from '../dtos/forgot-password-dto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { UserStatus, UsersTypes } from 'src/common/enums/users.enum';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { SendPhoneOtpDto } from '../dtos/send-phone-otp-dto';


@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly otpService: OtpService,
    private readonly jwtService: JwtService,
  ) {}

  async completeUser(registerDto: UserRegisterDto, lang?: LanguagesEnum, image?: Express.Multer.File){ 
    const user = await this.usersService.updateUser(registerDto, lang, image);
    return { token: await this.createToken(user as UserEntity) };
  
  }

  async technicalCompleteRegister(registerDto: TechnicalRegisterDto, lang?: LanguagesEnum,image?: Express.Multer.File, workLicenseImage ?: Express.Multer.File, identityImage ?: Express.Multer.File){
    const user =  await this.usersService.updateTechnical(registerDto, lang, image, workLicenseImage, identityImage);
    return { token: await this.createToken(user as UserEntity) };
  }


  async login(loginDto: LoginDto, lang?: LanguagesEnum) {
    const {user, newUser} = await this.usersService.publicLogin(loginDto, lang);
    const otpResponse = await this.sendPhoneOtp({
      phone: user.phone,
      purpose: OtpPurpose.Register,
    },  lang);

    return {
      newUser,
      otpResponse: otpResponse.msg
    };

  }

    async verifyPhoneOtp(verifyPhoneOtpDto: verifyPhoneOtpDto, lang?: LanguagesEnum) {
    const user = await this.usersService.checkUserExist({email:null,  phone: verifyPhoneOtpDto.phone });

    await this.otpService.verifyPhoneOtp(verifyPhoneOtpDto, lang);
    await this.usersService.changeUserStatus(user.id, UserStatus.ACTIVE);

    let token = null;
    if(!verifyPhoneOtpDto.newUser){
      token = await this.createToken(user as UserEntity);
    }
    const message = lang === LanguagesEnum.ARABIC ? 'رمز التحقق صالح' : 'Valid OTP';
    return { 
      msg: message, 
      token,
      id: user.id,
      name: user.username,
      status: user.status,
      locationStatus: user.locationStatus,
      blockedReason: user.blockedReason,
    };
  }

  async adminLogin(loginDto: AdminLoginDto, lang?: LanguagesEnum) {
    const user = await this.usersService.adminLogin(loginDto, lang);
    return await this.sendOtp({
      email: user.email,
      purpose: OtpPurpose.Register,
    },  user.username, lang);
  }
    // return { token: await this.createToken(user as UserEntity) };

  async forgetAdminPassword(forgetPasswordDto: ForgetAdminPasswordDto, lang?: LanguagesEnum) {
    const user = await this.usersService.findByEmail(forgetPasswordDto.email, lang, UserStatus.ACTIVE);

    await this.usersService.changeUserStatus(user.id, UserStatus.UNVERIFIED);

    return await this.sendOtp({
      email: user.email,
      purpose: OtpPurpose.forgetPassword,
    }, user.username, lang);
  }

  async verifyEmailOtp(verifyEmailOtpDto: verifyEmailOtpDto, lang?: LanguagesEnum) {
    const user = await this.usersService.findByEmail(verifyEmailOtpDto.email, lang);

    await this.otpService.verifyEmailOtp(verifyEmailOtpDto, lang);
    await this.usersService.changeUserStatus(user.id, UserStatus.ACTIVE);

    if(verifyEmailOtpDto.purpose === OtpPurpose.Register) {
      return { 
        token: await this.createToken(user as UserEntity),
        id: user.id,
        name: user.username,
        status: user.status,
        locationStatus: user.locationStatus,
        blockedReason: user.blockedReason,
      };
    }
    const message = lang === LanguagesEnum.ARABIC ? 'رمز التحقق صالح' : 'Valid OTP';
    return { msg: message };
  }

  public async resetPassword(resetPasswordDto: ResetPasswordDto, lang?: LanguagesEnum) {
    if (resetPasswordDto.newPassword !== resetPasswordDto.confirmPassword) {
      if (lang === LanguagesEnum.ARABIC) {
        throw new BadRequestException('كلمة المرور غير متطابقة');
      }
      throw new BadRequestException('Passwords do not match');
    }
    const userData = await this.usersService.resetPassword(resetPasswordDto, lang);

    await this.otpService.clearCache(
      resetPasswordDto.email,
      OtpPurpose.forgetPassword,
    );

    return { accessToken: await this.createToken(userData as UserEntity) };
  }

  public async sendOtp(SendEmailOtpDto: SendEmailOtpDto, name: string, lang?: LanguagesEnum) {
    await this.otpService.sendOtp(
      {
        email: SendEmailOtpDto.email,
        name
      },
      SendEmailOtpDto.purpose,
      lang,
    );

    if(lang === LanguagesEnum.ARABIC) {
      return { msg: 'تم إرسال رمز التحقق.'};
    }
    return { msg: 'Verification code is sent.'};
  }

  public async sendPhoneOtp(SendPhoneOtpDto: SendPhoneOtpDto, lang?: LanguagesEnum) {
    await this.otpService.sendPhoneOtp(
      SendPhoneOtpDto.phone,
      SendPhoneOtpDto.purpose,
      lang,
    );
    if (lang === LanguagesEnum.ARABIC) {
      return { msg: 'تم إرسال رمز التحقق.' };
    }
    return { msg: 'Verification code is sent.' };
  }

  public async resendOtp(resendOtp: SendEmailOtpDto, lang?: LanguagesEnum) {
    await this.otpService.clearCache(resendOtp.email, resendOtp.purpose);
    const user = await this.usersService.findByEmail(resendOtp.email, lang, UserStatus.UNVERIFIED);
    return await this.sendOtp(resendOtp, user.username, lang);
  }

  public async createToken(user: UserEntity): Promise<any> {
    const { id, email, type, phone } = user;
    if(type === UsersTypes.ADMIN){
      return this.jwtService.signAsync({
        id,
        email,
        type
      });
    }

    return this.jwtService.signAsync({
        id,
        phone,
        type
      });
  }
}
