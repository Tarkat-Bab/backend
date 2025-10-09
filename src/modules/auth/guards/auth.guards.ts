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
import { UserStatus, UsersTypes }    from '../../../common/enums/users.enum';
import { UsersService }  from '../../users/services/users.service';

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
      user = await this.usersService.findById(payload.id);
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
    };

    if (isPublic) return true;

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
