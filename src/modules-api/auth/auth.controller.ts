import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PublicDecorator } from 'src/common/decorators/public.decorator';
import { SkipPermission } from 'src/common/decorators/check-permission.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Xác Thực')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ! Các validation chỉ check ở Controller, không check ở Service

  @PublicDecorator()
  @Post('register')
  @ApiOperation({ summary: 'Đăng ký người dùng' })
  @ApiResponse({
    status: 201,
    description: 'Đăng ký thành công',
  })
  register(@Body() registerDto: RegisterDto) {
    const result = this.authService.register(registerDto);
    return result;
  }

  @PublicDecorator()
  @Post('login')
  @ApiOperation({ summary: 'Người dùng đăng nhập hệ thống' })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công',
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @SkipPermission()
  @Get('get-info')
  @ApiBearerAuth() // Bật Lock symbol tại api get-info
  @ApiOperation({ summary: 'Lấy thông tin người dùng đã đăng nhập' })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin người dùng đã đăng nhập',
  })
  getInfo(@Req() req: any) {
    return this.authService.getInfo(req);
  }
}
