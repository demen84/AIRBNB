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

@ApiTags('Vị Trí')
@Controller('vitri')
export class VitriController {
  constructor(private readonly vitriService: VitriService) { }

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

  @PublicDecorator()
  @SkipPermission()
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả vị trí' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách vị trí' })
  findAll(@Query() queryDto: PaginationQueryDto) {
    return this.vitriService.findAll(queryDto);
  }

  @PublicDecorator()
  @SkipPermission()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy 1 vị trí cụ thể theo mã vị trí' })
  @ApiResponse({ status: 200, description: 'Trả về thông tin vị trí' })
  findOne(@Param('id') id: string) {
    return this.vitriService.findOne(+id);
  }

  @Patch(':id')
  @ApiBearerAuth() // Bật Lock symbol
  @Roles('admin') // Đánh dấu chỉ admin mới được vào
  // ! QUAN TRỌNG: ProtectGuard phải đứng TRƯỚC RolesGuard
  @UseGuards(ProtectGuard, RolesGuard)
  @ApiOperation({ summary: 'Cập nhật vị trí (chỉ quyền admin)' })
  @ApiResponse({ status: 200, description: 'Cập nhật vị trí thành công' })
  async update(@Param('id') id: string, @Body() updateVitriDto: UpdateVitriDto) {
    return await this.vitriService.update(+id, updateVitriDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vitriService.remove(+id);
  }
}
