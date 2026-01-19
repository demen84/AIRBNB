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
import { ThrottlerGuard } from '@nestjs/throttler';
import { UseGuards } from '@nestjs/common';
import { RegisterThrottlerGuard } from 'src/common/guard/throttler/register-throttler.guard';
import { AuthGuard } from '@nestjs/passport';
import { Login2FADto, Verify2FADto } from './dto/2fa.dto';


@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // ! Các validation chỉ check ở Controller, không check ở Service

  @PublicDecorator()
  // @UseGuards(ThrottlerGuard) // Kích hoạt bộ đếm giới hạn tại đây
  @UseGuards(RegisterThrottlerGuard)
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

  // GOOGLE LOGIN
  @Get('google')
  @PublicDecorator()
  @ApiOperation({ summary: 'Đăng nhập bằng tài khoản Google', description: 'Mở link này trên trình duyệt: http://localhost:3839/api/auth/google' })
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: any) {
    // Route này sẽ tự động điều hướng sang trang login của Google
  }

  @Get('google/callback')
  @PublicDecorator()
  @ApiOperation({ summary: 'Google sẽ redirect về .../api/auth/google/callback?code=xxx&state=yyy' })
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any) {
    // Sau khi login xong, Google gửi data về đây.
    // Dữ liệu user nằm trong req.user (được return từ hàm validate ở trên)
    return this.authService.googleLogin(req.user);
  }

  // GENERATE 2FA QR CODE
  @Post('2fa/generate')
  @ApiBearerAuth() // Bật Lock symbol
  @ApiOperation({ summary: 'Bước 1: Tạo mã QR để thiết lập 2FA' })
  async generate2FA(@Req() req: any) {
    // req.user.id lấy từ Access Token của người đang đăng nhập
    return this.authService.generate2FA(req.user.id);
  }

  // TURN ON 2FA
  @Post('2fa/turn-on')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bước 2: Xác nhận mã OTP để bật 2FA chính thức' })
  async turnOn2FA(@Req() req: any, @Body() verify2FADto: Verify2FADto) {
    // req.user.id lấy từ Token hiện tại
    return this.authService.turnOn2FA(req.user.id, verify2FADto.code);
  }

  // VERIFY LOGIN 2FA
  @PublicDecorator()
  @Post('2fa/verify-login')
  @ApiOperation({ summary: 'Bước cuối: Nhập mã OTP sau khi login để lấy Token chính thức' })
  async verifyLogin2FA(@Body() login2FADto: Login2FADto) {
    return this.authService.verifyLogin2FA(login2FADto.userId, login2FADto.code);
  }
}
