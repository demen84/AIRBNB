// nest g resource modules-api/binhluan --no-spec
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateBinhluanDto } from './dto/create-binhluan.dto';
import { datphong_trang_thai } from '../../modules-system/prisma/generated/prisma/client';
import { PrismaService } from 'src/modules-system/prisma/prisma.service';
import type { AuthUser } from 'src/common/interface/auth-user.interface';
import { buildQuery } from 'src/common/helper/build-query.helper';
import { PaginationQueryDto } from '../phong/dto/query.dto';

@Injectable()
export class BinhluanService {
  constructor(private readonly prisma: PrismaService) {}

  // TẠO BÌNH LUẬN & ĐÁNH GIÁ
  async create(createBinhluanDto: CreateBinhluanDto, currentUser: AuthUser) {
    const { ma_phong, noi_dung, sao_binh_luan } = createBinhluanDto;

    // 1. Kiểm tra phòng có tồn tại không
    const checkPhong = await this.prisma.phong.findUnique({
      where: { id: ma_phong },
    });
    if (!checkPhong) throw new NotFoundException('Phòng không tồn tại');

    // 2. LOGIC ANTI-FAKE REVIEW: Kiểm tra xem user đã ở phòng này chưa
    // Lưu ý: Chỉ tính những đơn đã 'completed'
    const hasStayed = await this.prisma.datphong.findFirst({
      where: {
        ma_phong,
        ma_nguoi_dat: currentUser.id,
        trang_thai: datphong_trang_thai.completed,
      },
    });

    if (!hasStayed) {
      throw new ForbiddenException(
        'Chống review ảo: Bạn cần hoàn tất chuyến đi (status: completed) tại phòng này để gửi đánh giá.',
      );
    }

    // 3. Lưu bình luận mới
    const newComment = await this.prisma.binhluan.create({
      data: {
        ma_phong,
        ma_nguoi_binh_luan: currentUser.id,
        noi_dung,
        sao_binh_luan,
      },
    });

    // 4. CẬP NHẬT ĐIỂM ĐÁNH GIÁ TRUNG BÌNH (Tối ưu performance)
    const allRatings = await this.prisma.binhluan.aggregate({
      where: { ma_phong },
      _avg: { sao_binh_luan: true },
    });

    // Cập nhật lại cột danh_gia trong bảng phong
    // Math.round giúp làm tròn sao (ví dụ 4.5 -> 5) vì cột danh_gia của bạn là kiểu Int
    await this.prisma.phong.update({
      where: { id: ma_phong },
      data: {
        danh_gia: Math.round(allRatings._avg.sao_binh_luan || 0),
      },
    });

    return {
      message: 'Cảm ơn bạn đã đánh giá trải nghiệm!',
      data: newComment,
    };
  }

  // LẤY DANH SÁCH BÌNH LUẬN
  async findAllByRoom(ma_phong: number, queryDto: PaginationQueryDto) {
    try {
      // 1. Lấy data phân trang
      const { page, pageSize, filters, skip } = buildQuery(queryDto);

      // 2. Xử lý logic keyword (tìm kiếm theo tên phòng & mô tả)
      const whereCondition = {
        ma_phong: ma_phong,
        ...filters, // các filters từ JSON
        ...(queryDto.keyword && {
          OR: [{ noi_dung: { contains: queryDto.keyword } }],
        }),
      };

      const dataPromise = this.prisma.binhluan.findMany({
        where: whereCondition,
        include: {
          nguoidung: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        skip: skip, // skip qua index bao nhiêu
        take: pageSize, // giới hạn số lượng bình luận lấy ra
        // Lấy tất cả fields nên không cần select: {id: true, ....}
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      });

      const totalItemPromise = this.prisma.binhluan.count({
        where: whereCondition,
      });

      // 3. Truy vấn song song
      const [data, totalItem] = await Promise.all([
        dataPromise,
        totalItemPromise,
      ]);

      // Tính tổng số trang
      const totalPage = Math.ceil(totalItem / pageSize);

      // 4. Thống kê số lượng từng mức sao
      const ratingStats = await this.prisma.binhluan.groupBy({
        by: ['sao_binh_luan'],
        where: { ma_phong },
        _count: { id: true },
      });

      // 5. Trả về kết quả phân trang
      return {
        thongBao: 'Lấy danh sách bình luận thành công',
        page: page,
        pageSize: pageSize,
        totalItem: totalItem,
        totalPage: totalPage,
        ratingStats: ratingStats,
        items: data || [],
      };
    } catch (error) {
      console.error('Lỗi khi lấy danh sách bình luận:', error);
      throw new InternalServerErrorException(
        'Không thể lấy danh sách bình luận',
      );
    }
  }

  // XÓA BÌNH LUẬN, chỉ xóa bình luận của chính mình
  async remove(id: number, userId: number) {
    // 1. Tìm bình luận và kiểm tra quyền sở hữu
    const comment = await this.prisma.binhluan.findUnique({ where: { id } });

    if (!comment) throw new NotFoundException('Không tìm thấy bình luận');
    if (comment.ma_nguoi_binh_luan !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền xóa bình luận của người khác',
      );
    }

    const ma_phong = comment.ma_phong;

    // 2. Xóa bình luận
    await this.prisma.binhluan.delete({ where: { id } });

    // 3. Cập nhật lại điểm trung bình cho phòng
    const allRatings = await this.prisma.binhluan.aggregate({
      where: { ma_phong },
      _avg: { sao_binh_luan: true },
    });

    await this.prisma.phong.update({
      where: { id: ma_phong },
      data: {
        danh_gia: Math.round(allRatings._avg.sao_binh_luan || 0),
      },
    });

    return { message: 'Xóa bình luận thành công' };
  }
}
