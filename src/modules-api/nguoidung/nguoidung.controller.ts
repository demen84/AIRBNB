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

    // if (userIdFromToken !== targetId) {
    //   throw new ForbiddenException(
    //     'Bạn chỉ có thể cập nhật thông tin của chính mình',
    //   );
    // }

    return this.nguoidungService.update(targetId, updateNguoidungDto, userIdFromToken);
  }

  // Có nên làm chức năng xóa hay không? Chỉ admin mới có quyền xóa (banned) user
  @Delete(':id')
  @ApiOperation({
    summary: 'Xóa thông tin người dùng. Chỉ Admin mới có quyền xóa người dùng',
  })
  @ApiResponse({
    status: 200,
    description: 'Xóa người dùng thành công',
  })
  remove(@Param('id') id: string) {
    return this.nguoidungService.remove(+id);
  }
}
