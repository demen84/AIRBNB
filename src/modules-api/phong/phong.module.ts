import { Module } from '@nestjs/common';
import { PhongService } from './phong.service';
import { PhongController } from './phong.controller';
import { PrismaModule } from 'src/modules-system/prisma/prisma.module';

@Module({
  // imports: [PrismaModule], // Nếu PhongService có sử dụng prisma thì import PrismaModule vào dòng này.
  controllers: [PhongController],
  providers: [PhongService],
})
export class PhongModule {}
