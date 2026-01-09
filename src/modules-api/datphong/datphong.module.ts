import { Module } from '@nestjs/common';
import { DatphongService } from './datphong.service';
import { DatphongController } from './datphong.controller';
import { TokenModule } from 'src/modules-system/token/token.module';

@Module({
  // imports: [TokenModule],
  controllers: [DatphongController],
  providers: [DatphongService],
})
export class DatphongModule {}
