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
  Post,
  UseInterceptors,
  BadRequestException,
  ParseIntPipe,
  UploadedFile,
} from '@nestjs/common';
import { NguoidungService } from './nguoidung.service';
import type { Request } from 'express';
import { UpdateNguoidungDto } from './dto/update-nguoidung.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipPermission } from 'src/common/decorators/check-permission.decorator';
import { PaginationQueryDto } from '../phong/dto/query.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { AuthUser } from 'src/common/interface/auth-user.interface';
import * as fs from 'fs';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';

// Cấu hình storage cho Cloudinary
const storageCloudinary = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'avatar_nguoi_dung',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      return `avatar-${uniqueSuffix}`;
    },
  } as any,
});

// ------------CODE HERE---------------

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
  @ApiParam({
    name: 'id',
    description: 'Mã người dùng',
    type: Number,
    example: 1,
  })
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

    return this.nguoidungService.update(
      targetId,
      updateNguoidungDto,
      userIdFromToken,
    );
  }

  // Xóa người dùng. Chỉ admin mới có quyền xóa (banned) user
  @Delete(':id')
  @ApiBearerAuth() // Bật Lock symbol
  @ApiOperation({ summary: 'Khóa người dùng (chỉ quyền admin)' })
  @ApiResponse({ status: 200, description: 'Khóa người dùng thành công' })
  @ApiResponse({ status: 403, description: 'Chỉ admin mới có quyền khóa' })
  @ApiResponse({ status: 404, description: 'Người dùng không tồn tại' })
  @ApiResponse({
    status: 400,
    description: 'Không thể tự khóa hoặc khóa admin khác',
  })
  @ApiParam({
    name: 'id',
    description: 'Mã người dùng',
    type: Number,
    example: 1,
  })
  banUser(@Param('id') id: string, @Req() req: Request) {
    const currentUser = req.user as any;
    return this.nguoidungService.banUser(+id, {
      id: currentUser.id,
      role: currentUser.role,
    });
  }

  /**
   * UPLOAD HÌNH ẢNH
   */
  @Post('upload-avatar-to-localdisk/:id')
  @ApiConsumes('multipart/form-data') // Bắt buộc để Swagger hiện nút upload
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          // Tên này phải khớp với @UseInterceptors(FileInterceptor('avatar'))
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads/avatar_nguoi_dung', // Thư mục lưu ảnh
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `avatar-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
          return callback(
            new BadRequestException('Định dạng file hình không hợp lệ.'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  @ApiOperation({
    summary: 'Upload avatar lưu tại local disk (chỉ được upload avatar của chính mình)',
  })
  @ApiParam({
    name: 'id',
    description: 'Mã người dùng (id)',
    type: Number,
    example: 1,
  })
  async uploadAvatarToLocalDisk(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() userLogin: AuthUser, // Lấy thông tin user từ token
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn avatar để upload');
    }

    // 1. Kiểm tra quyền sở hữu (Chỉ chính chủ mới được upload)
    if (userLogin.id !== id) {
      // Xóa file rác Multer đã lỡ lưu vào folder uploads
      const filePath = join(
        process.cwd(),
        'uploads/avatar_nguoi_dung',
        file.filename,
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw new ForbiddenException(
        'Bạn chỉ có quyền upload avatar của chính mình.',
      );
    }
    // const fileName = file.filename;
    return this.nguoidungService.uploadAvatarToLocalDisk(id, file.filename);
  }

  // UPLOAD to CLOUDINADY
  @Post('upload-avatar-to-cloudinary/:id')
  @ApiConsumes('multipart/form-data') // Bắt buộc để Swagger hiện nút upload
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          // Tên này phải khớp với @UseInterceptors(FileInterceptor('avatar'))
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'Mã người dùng (id)',
    type: Number,
    example: 1,
  })
  @UseInterceptors(FileInterceptor(
    'avatar',
    {
      storage: storageCloudinary,
      limits: { fileSize: 2 * 1024 * 1024 } // ! Giới hạn avatar chỉ 2MB
    }
  ))
  @ApiOperation({
    summary: 'Upload avatar lưu lên cloudinary (chỉ được upload avatar của chính mình)',
  })
  async uploadAvatarToCloud(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() userLogin: AuthUser,
  ) {
    if (!file) throw new BadRequestException('Vui lòng chọn avatar');

    // Logic kiểm tra Ownership
    if (userLogin.id !== id) {
      // Nếu sai quyền, xóa ngay ảnh vừa upload lên Cloudinary để tránh rác
      const publicId = file.filename; // multer-storage-cloudinary lưu public_id vào filename
      await cloudinary.uploader.destroy(publicId);
      throw new ForbiddenException('Bạn chỉ có quyền upload avatar của chính mình');
    }

    // file.path lúc này sẽ là URL của ảnh trên Cloudinary (vd: https://res.cloudinary.com/...)
    return this.nguoidungService.uploadAvatarToCloud(id, file.path);
  }
}
