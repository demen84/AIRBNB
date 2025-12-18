import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VitriService } from './vitri.service';
import { CreateVitriDto } from './dto/create-vitri.dto';
import { UpdateVitriDto } from './dto/update-vitri.dto';

@Controller('vitri')
export class VitriController {
  constructor(private readonly vitriService: VitriService) {}

  @Post()
  create(@Body() createVitriDto: CreateVitriDto) {
    return this.vitriService.create(createVitriDto);
  }

  @Get()
  findAll() {
    return this.vitriService.findAll();
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
