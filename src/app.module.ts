import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VitriModule } from './modules-api/vitri/vitri.module';
import { NguoidungModule } from './modules-api/nguoidung/nguoidung.module';
import { PhongModule } from './modules-api/phong/phong.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules-api/auth/auth.module';
import { PrismaModule } from './modules-system/prisma/prisma.module';
import { TokenModule } from './modules-system/token/token.module';
import { ProtectStrategy } from './common/guard/protect/protect.strategy';
import { CheckPermisionStrategy } from './common/guard/check-permission/check-permission.strategy';


@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    PrismaModule,
    TokenModule,
    VitriModule,
    NguoidungModule,
    PhongModule,
  ],
  controllers: [AppController],

  // CheckPermisionStrategy là 1 @Injectable() & nó sd global nên ta bỏ nó vào provider của file app.module.ts là hợp lý.
  providers: [AppService, ProtectStrategy, CheckPermisionStrategy],
})
export class AppModule { }
