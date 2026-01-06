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

@ApiTags('Vị Trí')
@Controller('vitri')
export class VitriController {
  constructor(private readonly vitriService: VitriService) {}

  // Chỉ admin mới có quyền tạo vị trí mới
  @Post()
  @ApiBearerAuth() // Bật Lock symbol
  // @Roles('admin') // Đánh dấu chỉ admin mới được vào
  // @UseGuards(AuthGuard, RolesGuard) // Chạy AuthGuard trước để lấy user, sau đó RolesGuard check quyền
  @ApiOperation({ summary: 'Thêm vị trí (chỉ quyền admin)' })
  @ApiResponse({ status: 200, description: 'Thêm vị trí thành công' })
  create(@Body() createVitriDto: CreateVitriDto, @Req() req: Request) {
    const currentUser = req.user as any;
    const roleAdmin = currentUser.role;

    return this.vitriService.create(createVitriDto, roleAdmin);
  }

  @PublicDecorator()
  @SkipPermission()
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả vị trí' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách vị trí' })
  findAll(@Query() queryDto: PaginationQueryDto) {
    return this.vitriService.findAll(queryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vitriService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVitriDto: UpdateVitriDto) {
    return this.vitriService.update(+id, updateVitriDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vitriService.remove(+id);
  }
}
