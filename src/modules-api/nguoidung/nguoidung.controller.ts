import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { NguoidungService } from './nguoidung.service';
import type { Request } from 'express';
import { UpdateNguoidungDto } from './dto/update-nguoidung.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipPermission } from 'src/common/decorators/check-permission.decorator';
import { PaginationQueryDto } from '../phong/dto/query.dto';

@ApiTags('Quản Lý Người Dùng')
@Controller('nguoidung')
export class NguoidungController {
  constructor(private readonly nguoidungService: NguoidungService) { }

  // Lấy danh sách users
  @SkipPermission()
  @Get()
  @ApiBearerAuth() // Bật Lock symbol
  @ApiOperation({ summary: 'Lấy danh sách người dùng (phân trang + tìm kiếm)' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách người dùng' })
  finAll(@Query() queryDto: PaginationQueryDto, @Req() req: any) {
    return this.nguoidungService.findAll(queryDto);
  }

  // Update thông tin user
  // ! Người dùng chỉ có thể update thông tin của chính mình
  @Patch(':id')
  @ApiBearerAuth() // Bật Lock symbol
  @ApiOperation({ summary: 'Cập nhật thông tin người dùng' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thông tin người dùng thành công',
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền cập nhật người dùng này',
  })
  @ApiResponse({ status: 404, description: 'Người dùng không tồn tại' })
  update(
    @Param('id') id: string,
    @Body() updateNguoidungDto: UpdateNguoidungDto,
    @Req() req: Request, // Lấy thông tin user từ token
  ) {
    const currentUser = req.user as any; // xem lại sau
    if (!currentUser) {
      throw new ForbiddenException('Không tìm thấy thông tin người dùng');
    }

    const targetId = +id;
    const userIdFromToken = currentUser.id;

    return this.nguoidungService.update(targetId, updateNguoidungDto, userIdFromToken);
  }

  // Xóa người dùng. Chỉ admin mới có quyền xóa (banned) user
  @Delete(':id')
  @ApiBearerAuth() // Bật Lock symbol
  @ApiOperation({ summary: 'Khóa người dùng (chỉ quyền admin)' })
  @ApiResponse({ status: 200, description: 'Khóa người dùng thành công' })
  @ApiResponse({ status: 403, description: 'Chỉ admin mới có quyền khóa' })
  @ApiResponse({ status: 404, description: 'Người dùng không tồn tại' })
  @ApiResponse({ status: 400, description: 'Không thể tự khóa hoặc khóa admin khác' })
  banUser(@Param('id') id: string, @Req() req: Request) {
    const currentUser = req.user as any;
    // const adminRole = req.user?.role; // Lấy role từ token
    return this.nguoidungService.banUser(+id, {
      id: currentUser.id,
      role: currentUser.role,
    });
  }
}
