import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { NguoidungService } from './nguoidung.service';
import { CreateNguoidungDto } from './dto/create-nguoidung.dto';
import { UpdateNguoidungDto } from './dto/update-nguoidung.dto';

@Controller('nguoidung')
export class NguoidungController {
  constructor(private readonly nguoidungService: NguoidungService) {}

  @Post()
  create(@Body() createNguoidungDto: CreateNguoidungDto) {
    return this.nguoidungService.create(createNguoidungDto);
  }

  @Get()
  findAll() {
    return this.nguoidungService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.nguoidungService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNguoidungDto: UpdateNguoidungDto) {
    return this.nguoidungService.update(+id, updateNguoidungDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.nguoidungService.remove(+id);
  }
}
