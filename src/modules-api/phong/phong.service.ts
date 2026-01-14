import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePhongDto } from './dto/create-phong.dto';
import { UpdatePhongDto } from './dto/update-phong.dto';
import { buildQuery } from 'src/common/helper/build-query.helper';
import { PrismaService } from 'src/modules-system/prisma/prisma.service';
import * as fs from 'fs';
import { join } from 'path';
import { PaginationQueryDto } from './dto/query.dto';
import { SearchRoomDto } from './dto/search-room.dto';
// import { contains } from 'class-validator';

@Injectable()
export class PhongService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createPhongDto: CreatePhongDto) {
    try {
      const {
        ten_phong,
        mo_ta,
        khach,
        phong_ngu,
        giuong,
        phong_tam,
        gia_tien,
        may_giat,
        tivi,
        dieu_hoa,
        wifi,
        bep,
        do_xe,
        ho_boi,
        ban_ui,
        ma_vi_tri,
      } = createPhongDto;

      // 1. KIỂM TRA RÀNG BUỘC: Mã vị trí phải tồn tại trong bảng vitri
      const checkVitri = await this.prisma.vitri.findUnique({
        where: { id: createPhongDto.ma_vi_tri },
      });

      if (!checkVitri) {
        // Trả về 404 nếu không tìm thấy vị trí để gán phòng vào
        throw new NotFoundException(
          `Mã vị trí #${createPhongDto.ma_vi_tri} không tồn tại trong hệ thống.`,
        );
      }

      // 2. Thực hiện tạo phòng
      const newPhong = await this.prisma.phong.create({
        data: createPhongDto,
      });

      return {
        message: 'Thêm mới phòng thành công',
        data: newPhong,
      };
    } catch (error) {
      // Chuyển tiếp các lỗi HTTP đã biết (404, 403...)
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
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
            { mo_ta: { contains: queryDto.keyword } },
          ],
        }),
      };

      const dataPromise = this.prisma.phong.findMany({
        where: whereCondition,
        skip: skip, // skip qua index bao nhiêu
        take: pageSize,
        // Lấy tất cả fields nên không cần select: {id: true, ....}
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      });

      const totalItemPromise = this.prisma.phong.count({
        where: whereCondition,
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
        id: true,
        ten_phong: true,
        gia_tien: true,
        giuong: true,
        ma_vi_tri: true,
        vitri: {
          select: { ten_vi_tri: true },
        },
      },
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
    // 1. Kiểm tra phòng có tồn tại không
    const phong = await this.prisma.phong.findUnique({ where: { id } });
    if (!phong)
      throw new NotFoundException('Không tìm thấy phòng cần cập nhật');

    // 2. Tiến hành cập nhật
    const updatedData = await this.prisma.phong.update({
      where: { id },
      data: updatePhongDto,
    });

    return {
      message: `Cập nhật thông tin phòng #${id} thành công`,
      data: updatedData,
    };

  }

  async remove(id: number) {
    // 1. Kiểm tra phòng có tồn tại trong db & đếm SL phòng liên quan (phòng đã phát sinh bảng đặt phòng)
    const phongExists = await this.prisma.phong.findUnique({
      where: { id },
      select: { // => nhẹ hơn include
        id: true,
        // Đếm số lượng bản ghi ở table datphong có ma_phong = id
        _count: { select: { datphong: true } }
      },
    });
    // 2. Nếu không tồn tại phòng
    if (!phongExists) {
      throw new NotFoundException(`Không tồn tại phòng có id=${id}`);
    }

    // 3. KIỂM TRA RÀNG BUỘC: Nếu số lượng phòng > 0 thì không cho xóa
    if (phongExists._count.datphong > 0) {
      throw new BadRequestException(
        `Phòng #${id} đã được đặt nên không thể xóa.`,
      );
    }

    // 4. Nếu phòng chưa phát sinh trong đặt phòng, tiến hành xóa
    await this.prisma.phong.delete({
      where: { id },
    });

    return {
      message: 'Xóa phòng thành công.',
    };
  }

  async uploadHinh(id: number, filename: string) {
    try {
      // 1. Kiểm tra vị trí có tồn tại không
      const phong = await this.prisma.phong.findUnique({ where: { id } });
      if (!phong) throw new NotFoundException('Phòng này không tồn tại');

      // 2. Nếu phòng đã có ảnh cũ, thực hiện xóa file cũ đi
      if (phong.hinh_anh) {
        const oldPath = join(process.cwd(), 'uploads/phong', phong.hinh_anh);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath); // Xóa file cũ
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


  // TÌM KIẾM PHÒNG CÒN TRỐNG
  async findAvailableRooms(searchRoomDto: SearchRoomDto) {
    try {
      // 1. Giải nén dữ liệu từ buildQuery (để lấy skip, pageSize và các filter cơ bản)
      const { page, pageSize, filters, skip } = buildQuery(searchRoomDto);

      // 2. Lấy các tham số tìm kiếm nâng cao từ queryDto
      const { ma_vi_tri, so_khach, ngay_den, ngay_di } = searchRoomDto;

      // 3. Xây dựng điều kiện lọc (Where Condition)
      const whereCondition: any = {
        ...filters, // Giữ lại các filter từ buildQuery (như keyword)
      };

      // Lọc theo vị trí nếu có
      if (ma_vi_tri) {
        whereCondition.ma_vi_tri = Number(ma_vi_tri);
      }

      // Lọc theo sức chứa (số khách)
      if (so_khach) {
        whereCondition.khach = { gte: Number(so_khach) };
      }

      // --- LOGIC QUAN TRỌNG: Tìm phòng trống theo ngày ---
      if (ngay_den && ngay_di) {
        const checkIn = new Date(ngay_den);
        const checkOut = new Date(ngay_di);

        // Loại bỏ những phòng có lịch đặt trùng
        whereCondition.NOT = {
          datphong: {
            some: {
              // Chỉ xét những booking không bị hủy
              trang_thai: { not: 'cancelled' },
              // Thuật toán Overlap: Đơn đặt trùng lịch nếu (Start1 < End2) AND (End1 > Start2)
              AND: [
                { ngay_den: { lt: checkOut } },
                { ngay_di: { gt: checkIn } },
              ],
            },
          },
        };
      }

      // 4. Thực hiện truy vấn song song để tối ưu hiệu năng
      const dataPromise = this.prisma.phong.findMany({
        where: whereCondition,
        include: {
          vitri: true, // Lấy thông tin vị trí để hiển thị
        },
        skip: skip,
        take: pageSize,
        orderBy: { id: 'desc' },
      });

      const totalItemPromise = this.prisma.phong.count({
        where: whereCondition,
      });

      const [data, totalItem] = await Promise.all([
        dataPromise,
        totalItemPromise,
      ]);

      // 5. Tính toán và trả về kết quả
      const totalPage = Math.ceil(totalItem / pageSize);

      return {
        thongBao: 'Tìm kiếm danh sách phòng thành công',
        page,
        pageSize,
        totalItem,
        totalPage,
        items: data || [],
      };
    } catch (error) {
      console.error('Lỗi tìm kiếm phòng:', error);
      throw new InternalServerErrorException('Không thể thực hiện tìm kiếm phòng');
    }
  }
}
