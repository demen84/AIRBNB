import { Injectable } from '@nestjs/common';
import { CreatePhongDto } from './dto/create-phong.dto';
import { UpdatePhongDto } from './dto/update-phong.dto';
import { QueryDto } from './dto/query.dto';
import { buildQuery } from 'src/common/helper/build-query.helper';
import { PrismaService } from 'src/modules-system/prisma/prisma.service';

@Injectable()
export class PhongService {
  constructor(private readonly prisma: PrismaService) {}

  create(createPhongDto: CreatePhongDto) {
    return 'This action adds a new phong';
  }

  async findAll(queryDto: QueryDto) {
    const { page, pageSize, filters, skip } = buildQuery(queryDto);

    const take = pageSize;
    const phongPromise = this.prisma.phong.findMany({
      // skip qua index bao nhiêu
      where: filters,
      skip: skip,
      take: take,
    });
    const totalItemPromise = this.prisma.phong.count();

    const [phong, totalItem] = await Promise.all([
      phongPromise,
      totalItemPromise,
    ]);

    const totalPage = Math.ceil(totalItem / pageSize);

    return {
      thongBao: 'Lấy danh sách phòng thành công',
      page: page,
      pageSize: pageSize,
      totalItem: totalItem,
      totalPage: totalPage,
      items: phong || [],
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} phong`;
  }

  update(id: number, updatePhongDto: UpdatePhongDto) {
    return `This action updates a #${id} phong`;
  }

  remove(id: number) {
    return `This action removes a #${id} phong`;
  }
}
