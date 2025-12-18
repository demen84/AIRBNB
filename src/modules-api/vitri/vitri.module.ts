import { Module } from '@nestjs/common';
import { VitriService } from './vitri.service';
import { VitriController } from './vitri.controller';

@Module({
  controllers: [VitriController],
  providers: [VitriService],
})
export class VitriModule {}
