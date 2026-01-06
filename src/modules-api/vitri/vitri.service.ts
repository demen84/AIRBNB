import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateVitriDto } from './dto/create-vitri.dto';
import { UpdateVitriDto } from './dto/update-vitri.dto';
import { PrismaService } from 'src/modules-system/prisma/prisma.service';
import { PaginationQueryDto } from '../phong/dto/query.dto';
import { buildQuery } from 'src/common/helper/build-query.helper';

@Injectable()
export class VitriService {
  constructor(private prisma: PrismaService) {}

  async create(createVitriDto: CreateVitriDto, roleAdmin: string) {
    try {
      const { ten_vi_tri, tinh_thanh, quoc_gia } = createVitriDto;

      // 0. Kiểm tra quyền admin mới cho xóa
      if (roleAdmin !== 'admin') {
        throw new ForbiddenException(
          'Bạn không có quyền thực hiện hành động này',
        );
      }

      const newVitri = await this.prisma.vitri.create({
        data: {
          ten_vi_tri,
          tinh_thanh,
          quoc_gia,
          // Mặc định hình ảnh có thể để null hoặc ảnh placeholder
        },
      });

      return {
        message: 'Thêm vị trí thành công',
        data: newVitri,
      };
    } catch (error) {
      console.error('Chi tiết lỗi Prisma:', error);
      if (error instanceof ForbiddenException) throw error;

      throw new InternalServerErrorException('Lỗi khi thêm vị trí mới');
    }
  }

  // Lấy danh sách tất cả vị trí
  async findAll(queryDto: PaginationQueryDto) {
    try {
      const { page, pageSize, filters, skip } = buildQuery(queryDto);
      const vitriPromise = this.prisma.vitri.findMany({
        where: filters,
        skip: skip, // skip qua index bao nhiêu phần tử
        take: pageSize, // số phần tử cần lấy

        // Chỉ show các field cần thiết
        select: {
          id: true,
          ten_vi_tri: true,
          tinh_thanh: true,
          quoc_gia: true,
          hinh_anh: true,
          created_at: true,
        },
        orderBy: [{ created_at: 'asc' }, { id: 'desc' }],
      });

      const totalItemPromise = this.prisma.vitri.count({ where: filters });

      // Truy vấn xuống db nên phải dùng await
      const [vitri, totalItem] = await Promise.all([
        vitriPromise,
        totalItemPromise,
      ]); // vì vitri & totalItem chạy độc lập, nên ta cho nó chạy song song, bằng cách bỏ vào Promise.all() này. Ở trên ta bỏ await

      const totalPage = Math.ceil(totalItem / pageSize);

      return {
        message: 'Lấy danh sách vị trí thành công',
        page: page,
        pageSize: pageSize,
        totalItem: totalItem,
        totalPage: totalPage, // SL trang
        items: vitri || [],
      };
    } catch (error) {
      throw new InternalServerErrorException('Lỗi khi lấy danh sách vị trí');
    }
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
