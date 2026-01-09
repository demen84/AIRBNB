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
  UseInterceptors,
  ParseIntPipe,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { PhongService } from './phong.service';
import { CreatePhongDto } from './dto/create-phong.dto';
import { UpdatePhongDto } from './dto/update-phong.dto';
import { PaginationQueryDto } from './dto/query.dto';
import { SkipPermission } from 'src/common/decorators/check-permission.decorator';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ProtectGuard } from 'src/common/guard/protect/protect.guard';
import { RolesGuard } from 'src/common/guard/protect/roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PublicDecorator } from 'src/common/decorators/public.decorator';

@ApiTags('Quản Lý Phòng')
@Controller('phong')
export class PhongController {
  constructor(private readonly phongService: PhongService) { }

  // Chỉ admin mới có quyền create_new/update/delete phòng
  @Post()
  @ApiBearerAuth() // Bật Lock symbol
  @Roles('admin') // Đánh dấu chỉ admin mới vào được
  @UseGuards(ProtectGuard, RolesGuard)
  @ApiOperation({ summary: 'Tạo phòng mới (chỉ quyền Admin)' })
  @ApiResponse({ status: 200, description: 'Tạo phòng thành công' })
  async create(@Body() createPhongDto: CreatePhongDto) {
    return await this.phongService.create(createPhongDto);
  }

  @Get()
  @PublicDecorator()
  @SkipPermission()
  // @ApiBearerAuth() // Bật Lock symbol tại api lấy danh sách Phòng
  @ApiOperation({ summary: 'Lấy danh sách phòng (có phân trang & tìm kiếm)' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách phòng' })
  findAll(@Query() queryDto: PaginationQueryDto, @Req() req: any) {
    // console.log(req.user);
    return this.phongService.findAll(queryDto);
  }

  @Get(':id')
  @PublicDecorator()
  @SkipPermission()
  @ApiOperation({ summary: 'Lấy thông tin phòng' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin phòng thành công' })
  findOne(@Param('id') id: string) {
    return this.phongService.findOne(+id);
  }

  // UPDATE PHÒNG
  @Patch(':id')
  @ApiBearerAuth() // Bật Lock symbol
  @Roles('admin') // Đánh dấu chỉ admin mới được vào
  // ! QUAN TRỌNG: ProtectGuard phải đứng TRƯỚC RolesGuard
  @UseGuards(ProtectGuard, RolesGuard)
  @ApiOperation({ summary: 'Cập nhật thông tin phòng' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thông tin phòng thành công',
  })
  async update(
    @Param('id') id: string,
    @Body() updatePhongDto: UpdatePhongDto,
  ) {
    return await this.phongService.update(+id, updatePhongDto);
  }

  @Delete(':id')
  @ApiBearerAuth() // Bật ổ khóa
  @Roles('admin') // Quy định chỉ admin mới có quyền
  @UseGuards(ProtectGuard, RolesGuard)
  @ApiOperation({ summary: 'Xóa phòng (chỉ quyền admin)' })
  @ApiResponse({ status: 200, description: 'Xóa phòng thành công' })
  remove(@Param('id') id: string) {
    return this.phongService.remove(+id);
  }

  // UPLOAD HÌNH ẢNH VỊ TRÍ
  @Post('upload-hinh/:id')
  @ApiConsumes('multipart/form-data') // Bắt buộc để Swagger hiện nút upload
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        hinh_anh: {
          // Tên này phải khớp với @UseInterceptors(FileInterceptor('hinh_anh'))
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiBearerAuth()
  @Roles('admin')
  @UseGuards(ProtectGuard, RolesGuard)
  @UseInterceptors(
    FileInterceptor('hinh_anh', {
      storage: diskStorage({
        destination: './uploads/phong', // Thư mục lưu ảnh
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `vitri-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return callback(new Error('Chỉ chấp nhận file ảnh!'), false);
        }
        callback(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Upload hình ảnh phòng (Chỉ quyền Admin)' })
  async uploadHinh(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn hình ảnh để upload');
    }
    const fileName = file.filename;
    return this.phongService.uploadHinh(id, fileName);
  }
}
