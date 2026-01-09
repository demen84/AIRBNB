import { Controller, Get, Post, Body, Patch, Param, Delete, Req, ForbiddenException } from '@nestjs/common';
import { DatphongService } from './datphong.service';
import { CreateDatphongDto } from './dto/create-datphong.dto';
import { UpdateDatphongDto } from './dto/update-datphong.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import type { AuthUser } from 'src/common/interface/auth-user.interface';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('datphong')
export class DatphongController {
  constructor(private readonly datphongService: DatphongService) { }


  @Post()
  @ApiBearerAuth() // Bật Lock symbol
  @ApiOperation({ summary: 'Đặt phòng' })
  @ApiResponse({ status: 200, description: 'Đặt phòng thành công' })
  create(
    @Body() createDatphongDto: CreateDatphongDto,
    // @Req() req: Request, // lấy user từ token
    @CurrentUser() currentUser: AuthUser
  ) {
    // const currentUser = req.user as AuthUser;
    // if (!currentUser) {
    //   throw new ForbiddenException('Không tìm thấy người dùng');
    // }

    return this.datphongService.create(createDatphongDto, currentUser);
  }

  @Get()
  findAll() {
    return this.datphongService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.datphongService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDatphongDto: UpdateDatphongDto) {
    return this.datphongService.update(+id, updateDatphongDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.datphongService.remove(+id);
  }
}
