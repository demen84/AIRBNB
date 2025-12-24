import { Controller, Post } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Post('register')
  register() {
    return 'Register is OK';
  }

  @Post('login')
  login() {
    return 'Login Successfully';
  }
}
