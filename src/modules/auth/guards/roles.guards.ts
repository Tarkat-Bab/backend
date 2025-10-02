import { UsersService } from '../../users/services/users.service';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Unauthorized');
    }
    let payload;
    try {
      payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
    } catch (err) {
      throw new UnauthorizedException('invalid token');
    }
    const user = await this.usersService.findById(payload.id);
    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }
    request.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      type: user.type,
    };

    const requiredPermission = this.reflector.get<{
      enDescription: string;
      enModule: string;
      slug: string;
    }>('permissions', context.getHandler());
    // if (requiredPermission) {
    //   const { slug } = requiredPermission;
    //   const hasPermission = await this.usersService.hasPermission(
    //     user.id,
    //     slug,
    //   );
    //   if (!hasPermission) {
    //     throw new ForbiddenException('Forbidden');
    //   }
    // }

    return true;
  }
  private extractTokenFromHeader(request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
