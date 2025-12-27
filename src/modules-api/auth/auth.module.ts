import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  // providers: chỉ chứa các class được đánh dấu là @Injectable()
  providers: [AuthService],
})
export class AuthModule {}
