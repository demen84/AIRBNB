// nest g resource modules-api/binhluan --no-spec
import { Module } from '@nestjs/common';
import { BinhluanService } from './binhluan.service';
import { BinhluanController } from './binhluan.controller';

@Module({
  controllers: [BinhluanController],
  providers: [BinhluanService],
})
export class BinhluanModule {}
