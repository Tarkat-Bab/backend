import { Injectable }    from '@nestjs/common';
import { AuthService }   from './auth.service';

@Injectable()
export class OauthService {
  constructor(
    private readonly authService: AuthService,
  ) {}

  async oAuthRegister(user) {
    const checkUser = await this.authService.oAuthRegister(user);
    if (!checkUser) {
      return null;
    }
    return await this.authService.createToken(checkUser);
  }
}