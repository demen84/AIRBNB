import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VitriModule } from './modules-api/vitri/vitri.module';
import { NguoidungModule } from './modules-api/nguoidung/nguoidung.module';
import { PhongModule } from './modules-api/phong/phong.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules-api/auth/auth.module';
import { PrismaModule } from './modules-system/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    PrismaModule,
    VitriModule,
    NguoidungModule,
    PhongModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
