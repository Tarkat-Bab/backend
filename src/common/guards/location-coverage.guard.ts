import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LocationStatus } from '../enums/location-status.enum';
import { LanguagesEnum } from '../enums/lang.enum';

export const SKIP_LOCATION_CHECK = 'skipLocationCheck';

@Injectable()
export class LocationCoverageGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipLocationCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_LOCATION_CHECK,
      [context.getHandler(), context.getClass()],
    );

    if (skipLocationCheck) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true;
    }

    const lang = (request.headers['accept-language'] || 'en').toLowerCase();

    if (user.locationStatus === LocationStatus.OUT_OF_COVERAGE) {
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

    return true;
  }
}
