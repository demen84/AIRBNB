import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from 'src/modules-system/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  // providers: chỉ chứa các class được đánh dấu là @Injectable()
  providers: [AuthService],
})
export class AuthModule {}
