// nest g resource modules-api/auth --no-spec
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from 'src/modules-system/prisma/prisma.module';
import { TokenModule } from 'src/modules-system/token/token.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { GoogleStrategy } from 'src/modules-system/auth/strategies/google.strategy';

@Module({
  imports: [
    PrismaModule,
    TokenModule,
    ThrottlerModule.forRoot([
      {
        name: 'register_limit',
        ttl: 600000, // 10 phút tính bằng milisecond (10 * 60 * 1000)
        limit: 5, // Tối đa 5 lần
      },
    ]),
  ],
  controllers: [AuthController],
  // providers: chỉ chứa các class được đánh dấu là @Injectable()
  providers: [AuthService, GoogleStrategy],
})
export class AuthModule {}
