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
import { VitriService } from './vitri.service';
import type { Request } from 'express';
import { CreateVitriDto } from './dto/create-vitri.dto';
import { UpdateVitriDto } from './dto/update-vitri.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PublicDecorator } from 'src/common/decorators/public.decorator';
import { PaginationQueryDto } from '../phong/dto/query.dto';
import { SkipPermission } from 'src/common/decorators/check-permission.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guard/protect/roles.guard';
import { ProtectGuard } from 'src/common/guard/protect/protect.guard';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('Vị Trí')
@Controller('vitri')
export class VitriController {
  constructor(private readonly vitriService: VitriService) {}

  // TẠO VỊ TRÍ MỚI
  // Chỉ admin mới có quyền tạo vị trí mới
  @Post()
  @ApiBearerAuth() // Bật Lock symbol
  @Roles('admin') // Đánh dấu chỉ admin mới được vào
  // ! QUAN TRỌNG: ProtectGuard phải đứng TRƯỚC RolesGuard
  @UseGuards(ProtectGuard, RolesGuard)
  @ApiOperation({ summary: 'Thêm vị trí (chỉ quyền admin)' })
  @ApiResponse({ status: 200, description: 'Thêm vị trí thành công' })
  async create(@Body() createVitriDto: CreateVitriDto) {
    return await this.vitriService.create(createVitriDto);
  }

  // LẤY DANH SÁCH VỊ TRÍ
  @Get()
  @PublicDecorator()
  @SkipPermission()
  @ApiOperation({ summary: 'Lấy danh sách tất cả vị trí' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách vị trí' })
  findAll(@Query() queryDto: PaginationQueryDto) {
    return this.vitriService.findAll(queryDto);
  }

  // LẤY 1 VỊ TRÍ CỤ THỂ
  @Get(':id')
  @PublicDecorator()
  @SkipPermission()
  @ApiOperation({ summary: 'Lấy 1 vị trí cụ thể theo mã vị trí' })
  @ApiResponse({ status: 200, description: 'Trả về thông tin vị trí' })
  findOne(@Param('id') id: string) {
    return this.vitriService.findOne(+id);
  }

  // UPDATE VỊ TRÍ
  @Patch(':id')
  @ApiBearerAuth() // Bật Lock symbol
  @Roles('admin') // Đánh dấu chỉ admin mới được vào
  // ! QUAN TRỌNG: ProtectGuard phải đứng TRƯỚC RolesGuard
  @UseGuards(ProtectGuard, RolesGuard)
  @ApiOperation({ summary: 'Cập  thông tin vị trí (chỉ quyền admin)' })
  @ApiResponse({ status: 200, description: 'Cập nhật vị trí thành công' })
  async update(
    @Param('id') id: string,
    @Body() updateVitriDto: UpdateVitriDto,
  ) {
    return await this.vitriService.update(+id, updateVitriDto);
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
        destination: './uploads/vitri', // Thư mục lưu ảnh
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
  @ApiOperation({ summary: 'Upload hình ảnh cho vị trí (chỉ admin)' })
  async uploadHinh(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn hình ảnh để upload');
    }
    const fileName = file.filename;
    return this.vitriService.uploadHinh(id, fileName);
  }

  // XÓA VỊ TRÍ
  @Delete(':id')
  @ApiBearerAuth() // Bật Lock symbol
  @Roles('admin') // Đánh dấu chỉ admin mới được vào
  // ! QUAN TRỌNG: ProtectGuard phải đứng TRƯỚC RolesGuard
  @UseGuards(ProtectGuard, RolesGuard)
  @ApiOperation({ summary: 'Xóa vị trí (chỉ quyền admin)' })
  @ApiResponse({ status: 200, description: 'Xóa vị trí thành công' })
  @ApiResponse({
    status: 400,
    description: 'Vị trí đang có phòng, không thể xóa',
  })
  async remove(@Param('id') id: string) {
    return await this.vitriService.remove(+id);
  }
}
