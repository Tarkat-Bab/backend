import { Injectable } from '@nestjs/common';
import { isPublic } from './common/decorators/public.decorator';

@isPublic()
@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello from Tarket Bab API!';
  }
}
