// nest g resource modules-api/nguoidung --no-spec
import { Module } from '@nestjs/common';
import { NguoidungService } from './nguoidung.service';
import { NguoidungController } from './nguoidung.controller';
import { PrismaModule } from 'src/modules-system/prisma/prisma.module';
import { TokenModule } from 'src/modules-system/token/token.module';
import { CloudinaryProvider } from 'src/common/cloudinary/cloudinary.provider';

@Module({
  imports: [PrismaModule, TokenModule],
  controllers: [NguoidungController],
  providers: [NguoidungService, CloudinaryProvider],
})
export class NguoidungModule { }
