import { Injectable } from '@nestjs/common';
import { CreateNguoidungDto } from './dto/create-nguoidung.dto';
import { UpdateNguoidungDto } from './dto/update-nguoidung.dto';

@Injectable()
export class NguoidungService {
  create(createNguoidungDto: CreateNguoidungDto) {
    return 'This action adds a new nguoidung';
  }

  findAll() {
    return `This action returns all nguoidung`;
  }

  findOne(id: number) {
    return `This action returns a #${id} nguoidung`;
  }

  update(id: number, updateNguoidungDto: UpdateNguoidungDto) {
    return `This action updates a #${id} nguoidung`;
  }

  remove(id: number) {
    return `This action removes a #${id} nguoidung`;
  }
}
