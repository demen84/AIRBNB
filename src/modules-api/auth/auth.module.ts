import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from 'src/modules-system/prisma/prisma.module';
import { TokenModule } from 'src/modules-system/token/token.module';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    PrismaModule,
    TokenModule,
    ThrottlerModule.forRoot([{
      name: 'register_limit',
      ttl: 600000, // 10 phút tính bằng milisecond (10 * 60 * 1000)
      limit: 5,    // Tối đa 5 lần
    }]),
  ],
  controllers: [AuthController],
  // providers: chỉ chứa các class được đánh dấu là @Injectable()
  providers: [AuthService],
})
export class AuthModule { }
