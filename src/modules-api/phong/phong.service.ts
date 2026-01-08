import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePhongDto } from './dto/create-phong.dto';
import { UpdatePhongDto } from './dto/update-phong.dto';
import { buildQuery } from 'src/common/helper/build-query.helper';
import { PrismaService } from 'src/modules-system/prisma/prisma.service';
import * as fs from 'fs';
import { join } from 'path';
import { PaginationQueryDto } from './dto/query.dto';
// import { contains } from 'class-validator';

@Injectable()
export class PhongService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createPhongDto: CreatePhongDto) {
    try {
      const { ten_phong, mo_ta, khach, phong_ngu, giuong, phong_tam, gia_tien, may_giat, tivi, dieu_hoa, wifi, bep, do_xe, ho_boi, ban_ui, ma_vi_tri } = createPhongDto;

      // 1. KIỂM TRA RÀNG BUỘC: Mã vị trí phải tồn tại trong bảng vitri
      const checkVitri = await this.prisma.vitri.findUnique({
        where: { id: createPhongDto.ma_vi_tri },
      });

      if (!checkVitri) {
        // Trả về 404 nếu không tìm thấy vị trí để gán phòng vào
        throw new NotFoundException(`Mã vị trí ${createPhongDto.ma_vi_tri} không tồn tại trong hệ thống.`);
      }

      // 2. Thực hiện tạo phòng
      const newPhong = await this.prisma.phong.create({
        data: createPhongDto
      });

      return {
        message: 'Thêm mới phòng thành công',
        data: newPhong
      }
    } catch (error) {
      // Chuyển tiếp các lỗi HTTP đã biết (404, 403...)
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }

      console.error('Chi tiết lỗi tạo phòng:', error);
      if (error instanceof ForbiddenException) throw error;

      throw new InternalServerErrorException('Lỗi khi thêm phòngí mới');
    }
  }

  async findAll(queryDto: PaginationQueryDto) {
    try {
      // 1. Lấy data phân trang
      const { page, pageSize, filters, skip } = buildQuery(queryDto);

      // 2. Xử lý logic keyword (tìm kiếm theo tên phòng & mô tả)
      const whereCondition = {
        ...filters, // các filters từ JSON
        ...(queryDto.keyword && {
          OR: [
            { ten_phong: { contains: queryDto.keyword } },
            { mo_ta: { contains: queryDto.keyword } }
          ]
        })
      };

      const dataPromise = this.prisma.phong.findMany({
        // skip qua index bao nhiêu
        where: whereCondition,
        skip: skip,
        take: pageSize,
        // Lấy tất cả fields nên không cần select: {id: true, ....}
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      });

      const totalItemPromise = this.prisma.phong.count({
        where: whereCondition
      });

      // 3. Truy vấn song song
      const [data, totalItem] = await Promise.all([
        dataPromise,
        totalItemPromise,
      ]);

      // Tính tổng số trang
      const totalPage = Math.ceil(totalItem / pageSize);

      // 4. Trả về kết quả phân trang
      return {
        thongBao: 'Lấy danh sách phòng thành công',
        page: page,
        pageSize: pageSize,
        totalItem: totalItem,
        totalPage: totalPage,
        items: data || [],
      };
    } catch (error) {
      console.error('Lỗi khi lấy danh sách phòng:', error);
      throw new InternalServerErrorException('Không thể lấy danh sách phòng');
    }
  }

  async findOne(id: number) {
    // console.log(id);
    const data = await this.prisma.phong.findUnique({
      where: { id: id },
      select: {
        id: true, ten_phong: true, gia_tien: true, giuong: true,
        ma_vi_tri: true,
        vitri: {
          select: { ten_vi_tri: true }
        }
      }
    });
    // if (data) {
    //   const { created_at, updated_at, ...result } = data;
    //   return result; // result sẽ chứa tất cả trừ 2 field trên
    // }

    return {
      message: `Lấy thông tin phòng #${id} thành công`,
      data: data,
    };
  }

  async update(id: number, updatePhongDto: UpdatePhongDto) {
    return `This action updates a #${id} phong`;
  }

  remove(id: number) {
    return `This action removes a #${id} phong`;
  }

  async uploadHinh(id: number, filename: string) {
    try {
      // 1. Kiểm tra vị trí có tồn tại không
      const phong = await this.prisma.phong.findUnique({ where: { id } });
      if (!phong) throw new NotFoundException('Phòng này không tồn tại');

      // 2. Nếu vị trí đã có ảnh cũ, thực hiện xóa file cũ đi
      if (phong.hinh_anh) {
        const oldPath = join(process.cwd(), 'uploads/phong', phong.hinh_anh);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath); // Xóa file
        }
      }

      // 3. Cập nhật tên file vào DB
      const updatedPhong = await this.prisma.phong.update({
        where: { id },
        data: { hinh_anh: filename },
      });

      // 4. Response cho Front End
      return {
        message: 'Upload hình ảnh thành công',
        data: updatedPhong,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Lỗi khi lưu ảnh vào database');
    }
  }
}
