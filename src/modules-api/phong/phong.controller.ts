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
  UseGuards,
} from '@nestjs/common';
import { PhongService } from './phong.service';
import { CreatePhongDto } from './dto/create-phong.dto';
import { UpdatePhongDto } from './dto/update-phong.dto';
import { QueryDto } from './dto/query.dto';
import { AuthGuard } from '@nestjs/passport';
import { SkipPermission } from 'src/common/decorators/check-permission.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Quản Lý Phòng')
@Controller('phong')
export class PhongController {
  constructor(private readonly phongService: PhongService) {}

  @Post()
  create(@Body() createPhongDto: CreatePhongDto) {
    return this.phongService.create(createPhongDto);
  }

  @SkipPermission()
  @Get()
  @ApiBearerAuth() // Bật Lock symbol tại api lấy danh sách Phòng
  @ApiOperation({ summary: 'Lấy danh sách phòng (phân trang + tìm kiếm)' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách phòng' })
  // ===== HIỂN THỊ CÁC QUERY PARAM TRÊN SWAGGER =====
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Số trang (bắt đầu từ 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Số lượng phòng mỗi trang',
    example: 10,
  })
  findAll(@Query() queryDto: QueryDto, @Req() req: any) {
    // console.log(req.user);
    return this.phongService.findAll(queryDto);
  }

  @Get(':id')
  @ApiBearerAuth() // Bật Lock symbol
  findOne(@Param('id') id: string) {
    return this.phongService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePhongDto: UpdatePhongDto) {
    return this.phongService.update(+id, updatePhongDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.phongService.remove(+id);
  }
}
