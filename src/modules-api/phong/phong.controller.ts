import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { PhongService } from './phong.service';
import { CreatePhongDto } from './dto/create-phong.dto';
import { UpdatePhongDto } from './dto/update-phong.dto';
import { PaginationQueryDto } from './dto/query.dto';
import { SkipPermission } from 'src/common/decorators/check-permission.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Quản Lý Phòng')
@Controller('phong')
export class PhongController {
  constructor(private readonly phongService: PhongService) {}

  // Chỉ admin mới có quyền create_new/update/delete phòng
  @Post()
  @ApiOperation({ summary: 'Tạo danh sách phòng' })
  @ApiResponse({ status: 200, description: 'Tạo phòng thành công' })
  create(@Body() createPhongDto: CreatePhongDto) {
    return this.phongService.create(createPhongDto);
  }

  @SkipPermission()
  @Get()
  @ApiBearerAuth() // Bật Lock symbol tại api lấy danh sách Phòng
  @ApiOperation({ summary: 'Lấy danh sách phòng (có phân trang)' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách phòng' })
  findAll(@Query() queryDto: PaginationQueryDto, @Req() req: any) {
    // console.log(req.user);
    return this.phongService.findAll(queryDto);
  }

  @Get(':id')
  // @ApiBearerAuth() // Bật Lock symbol
  @ApiOperation({ summary: 'Lấy thông tin phòng' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin phòng thành công' })
  findOne(@Param('id') id: string) {
    return this.phongService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin phòng' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thông tin phòng thành công',
  })
  update(@Param('id') id: string, @Body() updatePhongDto: UpdatePhongDto) {
    return this.phongService.update(+id, updatePhongDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa phòng' })
  @ApiResponse({ status: 200, description: 'Xóa phòng thành công' })
  remove(@Param('id') id: string) {
    return this.phongService.remove(+id);
  }
}
