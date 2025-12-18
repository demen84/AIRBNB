import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VitriModule } from './modules-api/vitri/vitri.module';
import { NguoidungModule } from './modules-api/nguoidung/nguoidung.module';
import { PhongModule } from './modules-api/phong/phong.module';

@Module({
  imports: [VitriModule, NguoidungModule, PhongModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
