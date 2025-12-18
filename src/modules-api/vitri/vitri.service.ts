import { Injectable } from '@nestjs/common';
import { CreateVitriDto } from './dto/create-vitri.dto';
import { UpdateVitriDto } from './dto/update-vitri.dto';

@Injectable()
export class VitriService {
  create(createVitriDto: CreateVitriDto) {
    return 'This action adds a new vitri';
  }

  findAll() {
    return `This action returns all vitri`;
  }

  findOne(id: number) {
    return `This action returns a #${id} vitri`;
  }

  update(id: number, updateVitriDto: UpdateVitriDto) {
    return `This action updates a #${id} vitri`;
  }

  remove(id: number) {
    return `This action removes a #${id} vitri`;
  }
}
