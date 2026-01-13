// nest g resource modules-api/binhluan --no-spec
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Delete,
} from '@nestjs/common';
import { BinhluanService } from './binhluan.service';
import { CreateBinhluanDto } from './dto/create-binhluan.dto';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { AuthUser } from 'src/common/interface/auth-user.interface';
import { PaginationQueryDto } from '../phong/dto/query.dto';
import { PublicDecorator } from 'src/common/decorators/public.decorator';
import { SkipPermission } from 'src/common/decorators/check-permission.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Bình luận & Đánh giá')
@Controller('binhluan')
export class BinhluanController {
  constructor(private readonly binhluanService: BinhluanService) { }

  // TẠO BÌNH LUẬN & ĐÁNH GIÁ
  @Post()
  @ApiBearerAuth() // Bật Lock symbol
  @ApiOperation({
    summary: 'Gửi bình luận và đánh giá (Yêu cầu đã ở phòng này)',
  })
  create(
    @Body() createBinhluanDto: CreateBinhluanDto,
    // @Req() req: any,
    @CurrentUser() currentUser: AuthUser,
  ) {
    // const userId = req.user.id; // Lấy ID user từ token
    return this.binhluanService.create(createBinhluanDto, currentUser);
  }

  // LẤY DANH SÁCH BÌNH LUẬN theo phòng
  @Get('phong/:id')
  @PublicDecorator()
  @SkipPermission()
  @ApiOperation({
    summary:
      'Lấy danh sách bình luận của một phòng cụ thể (có phân trang & tìm kiếm theo/lọc bình luận)',
  })
  @ApiParam({
    name: 'id',
    description: 'Mã phòng',
    type: Number,
    example: 1,
  })
  findAllByRoom(
    @Param('id', ParseIntPipe) ma_phong: number,
    @Query() queryDto: PaginationQueryDto,
  ) {
    return this.binhluanService.findAllByRoom(ma_phong, queryDto);
  }

  // XÓA BÌNH LUẬN, chỉ xóa bình luận của chính mình
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa bình luận của chính mình' })
  @ApiParam({
    name: 'id',
    description: 'Mã bình luận',
    type: Number,
    example: 1,
  })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.binhluanService.remove(id, user.id);
  }
}
