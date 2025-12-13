import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector }     from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService }    from '@nestjs/jwt';

import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import { SKIP_LOCATION_CHECK } from '../../../common/guards/location-coverage.guard';
import { UserStatus, UsersTypes }    from '../../../common/enums/users.enum';
import { UsersService }  from '../../users/services/users.service';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { LocationStatus } from 'src/common/enums/location-status.enum';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const lang = (request.headers['accept-language'] || 'en').toLowerCase();

    const t = (ar: string, en: string) => (lang.startsWith('ar') ? ar : en);

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const token = this.extractTokenFromHeader(request);

    if (!token && !isPublic) {
      throw new UnauthorizedException(t('غير مصرح لك بالدخول', 'Unauthorized'));
    }

    let payload;
    try {
      payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
    } catch (err) {
      if (!isPublic)
        throw new UnauthorizedException(t('رمز الدخول غير صالح', 'Invalid token'));
    }

    let user;
    if (payload && payload.id) {
      user = await this.usersService.findUserForGuard(payload.id);
      if (!user) {
        throw new UnauthorizedException(t('المستخدم غير موجود', 'Unauthorized'));
      }
    }

    if (!user && !isPublic) {
      throw new UnauthorizedException(t('غير مصرح لك بالدخول', 'Unauthorized'));
    }

    if (user && user.status === UserStatus.BLOCKED) {
      throw new UnauthorizedException(t('تم حظر الحساب', 'Account is blocked'));
    }

    if (user && user.status === UserStatus.UNVERIFIED) {
      throw new UnauthorizedException(t('لم يتم تفعيل الحساب', 'Account is not verified'));
    }



    request.user = {
      id: user?.id,
      email: user?.email,
      phone: user?.phone,
      type: user?.type,
      locationStatus: user?.locationStatus,
      blockedReason: user?.blockedReason,
    };

    if (isPublic) return true;

    // Check location coverage (after user is set in request)
    const skipLocationCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_LOCATION_CHECK,
      [context.getHandler(), context.getClass()],
    );

    if (!skipLocationCheck && user && user.locationStatus === LocationStatus.OUT_OF_COVERAGE) {
      const arResponse = {
        code: 'OUT_OF_COVERAGE_AREA',
        message: 'الخدمة غير متوفرة في منطقتك',
        data: {
          type: 'FORBIDDEN_ACTION',
          title: 'منطقتك غير مدعومة',
          body: 'منطقتك غير مدعومة.',
          screen: 'forbidden_screen',
          click_action: 'GO_TO_UPDATE_DATA',
        },
      };

      const enResponse = {
        code: 'OUT_OF_COVERAGE_AREA',
        message: 'Service is not available in your area',
        data: {
          type: 'FORBIDDEN_ACTION',
          title: 'Your city is not supported',
          body: 'Your city is not supported.',
          screen: 'forbidden_screen',
          click_action: 'GO_TO_UPDATE_DATA',
        },
      };

      throw new ForbiddenException(
        lang.startsWith('ar') ? arResponse : enResponse,
      );
    }

    const requiredPermission = this.reflector.get<{
      arModule: string;
      enModule: string;
      key: string;
      type: UsersTypes[];
    }>('permissions', context.getHandler());

    if (!requiredPermission) return true;
    if (!requiredPermission.type?.includes(user?.type)) {
      throw new ForbiddenException(t('غير مسموح لك بالدخول', 'Forbidden'));
    }

    return true;
  }


  private extractTokenFromHeader(request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
