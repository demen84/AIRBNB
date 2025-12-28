import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // ý nghĩa: các chỗ khác có dùng Prisma thì ko cần import tại Module nữa.
@Module({
  imports: [],
  controllers: [],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
