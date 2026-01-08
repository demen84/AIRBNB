import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateVitriDto } from './dto/create-vitri.dto';
import { UpdateVitriDto } from './dto/update-vitri.dto';
import { PrismaService } from 'src/modules-system/prisma/prisma.service';
import { PaginationQueryDto } from '../phong/dto/query.dto';
import { buildQuery } from 'src/common/helper/build-query.helper';

import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class VitriService {
  constructor(private prisma: PrismaService) { }

  async create(createVitriDto: CreateVitriDto) {
    try {
      const { ten_vi_tri, tinh_thanh, quoc_gia } = createVitriDto;

      // // 0. Kiểm tra quyền admin mới cho xóa
      // if (roleAdmin !== 'admin') {
      //   throw new ForbiddenException(
      //     'Bạn không có quyền thực hiện hành động này',
      //   );
      // }

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
      // 1. Lấy dữ liệu phân trang (pagination)
      const { page, pageSize, filters, skip } = buildQuery(queryDto);

      /**
       * 2. Xử lý logic Keyword (Tìm kiếm theo tên vị trí hoặc tỉnh thành)
       * Có thể kết hợp filters từ JSON và keyword từ ô tìm kiếm
       */
      const whereCondition = {
        ...filters, // Các filters từ JSON
        ...(queryDto.keyword && {
          OR: [
            { ten_vi_tri: { contains: queryDto.keyword } },
            { tinh_thanh: { contains: queryDto.keyword } },
          ],
        }),
      };

      const dataPromise = this.prisma.vitri.findMany({
        where: whereCondition,
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
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      });

      const totalItemPromise = this.prisma.vitri.count({
        where: whereCondition,
      });

      // 3. Truy vấn song song, vì vitri & totalItem chạy độc lập, nên ta cho nó chạy song song, bằng cách bỏ vào Promise.all() này. Ở trên ta bỏ await
      const [data, totalItem] = await Promise.all([
        dataPromise,
        totalItemPromise,
      ]);

      // Tính tổng số trang
      const totalPage = Math.ceil(totalItem / pageSize);

      // 4. Trả về kết quả phân trang
      return {
        message: 'Lấy danh sách vị trí thành công',
        page: page,
        pageSize: pageSize,
        totalItem: totalItem,
        totalPage: totalPage, // SL trang
        items: data || [],
      };
    } catch (error) {
      console.error('Lỗi khi lấy danh sách vị trí:', error);
      throw new InternalServerErrorException('Không thể lấy danh sách vị trí');
    }
  }

  async findOne(id: number) {
    // console.log(id);
    const data = await this.prisma.vitri.findUnique({
      where: { id: id },
      select: {
        id: true,
        ten_vi_tri: true,
        tinh_thanh: true,
        quoc_gia: true,
        created_at: true,
      },
    });

    return {
      message: `Lấy vị trí #${id} thành công`,
      data: data,
    };
  }

  async update(id: number, updateVitriDto: UpdateVitriDto) {
    try {
      // 1. Kiểm tra vị trí có tồn tại không
      const vitri = await this.prisma.vitri.findUnique({ where: { id } });
      if (!vitri)
        throw new NotFoundException('Không tìm thấy vị trí cần cập nhật');

      // 2. Tiến hành cập nhật
      const updatedData = await this.prisma.vitri.update({
        where: { id },
        data: updateVitriDto,
      });

      return {
        message: `Cập nhật thông tin vị trí #${id} thành công`,
        data: updatedData,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Lỗi Update Prisma:', error);
      throw new InternalServerErrorException(
        'Lỗi hệ thống khi cập nhật vị trí',
      );
    }
  }

  async uploadHinh(id: number, filename: string) {
    try {
      // 1. Kiểm tra vị trí có tồn tại không
      const vitri = await this.prisma.vitri.findUnique({ where: { id } });
      if (!vitri) throw new NotFoundException('Vị trí không tồn tại');

      // 2. Nếu vị trí đã có ảnh cũ, thực hiện xóa file cũ đi
      if (vitri.hinh_anh) {
        const oldPath = join(process.cwd(), 'uploads/vitri', vitri.hinh_anh);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath); // Xóa file
        }
      }

      // 3. Cập nhật tên file vào DB
      const updatedVitri = await this.prisma.vitri.update({
        where: { id },
        data: { hinh_anh: filename },
      });

      // 4. Response cho Front End
      return {
        message: 'Upload hình ảnh thành công',
        data: updatedVitri,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Lỗi khi lưu ảnh vào database');
    }
  }

  async remove(id: number) {
    try {
      // 1. Kiểm tra vị trí có tồn tại trong db & đếm SL phòng liên quan (vị trí đã phát sinh phòng)
      const vitriExists = await this.prisma.vitri.findUnique({
        where: { id },
        include: {
          // Đếm số lượng bản ghi ở table phong có ma_vi_tri = id
          _count: { select: { phong: true } },
        },
      });
      // 2. Nếu không tồn tại vị trí
      if (!vitriExists) {
        throw new NotFoundException(`Không tồn tại vị trí có id=${id}`);
      }

      // 3. KIỂM TRA RÀNG BUỘC: Nếu số lượng phòng > 0 thì không cho xóa
      if (vitriExists._count.phong > 0) {
        throw new BadRequestException(
          `Không thể xóa vị trí này vì đang có ${vitriExists._count.phong} phòng thuộc vị trí này. Bạn phải xóa hoặc chuyển các phòng này đi nơi khác trước.`,
        );
      }

      // 4. Nếu không có phòng nào, tiến hành xóa
      await this.prisma.vitri.delete({
        where: { id },
      });

      return {
        message: 'Xóa vị trí thành công.',
      };
    } catch (error) {
      // Nếu là lỗi chúng ta chủ động ném ra (404, 400) thì ném tiếp cho Filter xử lý
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      console.error('Lỗi khi xóa vị trí:', error);
      throw new InternalServerErrorException(
        'Lỗi hệ thống khi thực hiện xóa vị trí.',
      );
    }
  }
}
