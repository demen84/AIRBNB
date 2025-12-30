import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { QueryDto } from '../phong/dto/query.dto';
import { PublicDecorator } from 'src/common/decorators/public.decorator';
import { SkipPermission } from 'src/common/decorators/check-permission.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ! Các validation chỉ check ở Controller, không check ở Service

  @PublicDecorator()
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    const result = this.authService.register(registerDto);
    return result;
  }
  @PublicDecorator()
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @SkipPermission()
  @Get('get-info')
  @ApiBearerAuth() // Bật Lock symbol tại api get-info
  getInfo(@Req() req: any) {
    return this.authService.getInfo(req);
  }

  @SkipPermission()
  @Get()
  @ApiBearerAuth() // Bật Lock symbol tại api get all user
  finAll(@Query() queryDto: QueryDto, @Req() req: any) {
    return this.authService.findAll(queryDto);
  }
}
