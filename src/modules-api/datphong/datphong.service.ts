import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDatphongDto } from './dto/create-datphong.dto';
import { UpdateDatphongDto } from './dto/update-datphong.dto';
import { PrismaService } from 'src/modules-system/prisma/prisma.service';
// import { TokenService } from 'src/modules-system/token/token.service';
import { datphong_trang_thai } from 'src/modules-system/prisma/generated/prisma/enums';
import { AuthUser } from 'src/common/interface/auth-user.interface';
import { UpdateBookingStatusDto } from './dto/update-bookingstatus.dto';
import { UpdateBookingByAdminDto } from './dto/update-booking-by-admin.dto';

@Injectable()
export class DatphongService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDatphongDto: CreateDatphongDto, currentUser: AuthUser) {
    // 0. Lấy data từ dto
    const { ma_phong, ngay_den, ngay_di, so_luong_khach } = createDatphongDto;

    const checkIn = new Date(ngay_den);
    const checkOut = new Date(ngay_di);

    // 1. Kiểm tra ngày đi > ngày đến
    if (checkOut <= checkIn) {
      throw new BadRequestException('Ngày đi phải lớn hơn ngày đến');
    }

    // 2. Check phòng có tồn tại không?
    const phong = await this.prisma.phong.findUnique({
      where: { id: ma_phong },
      select: { id: true, khach: true, gia_tien: true },
    });

    if (!phong) {
      throw new NotFoundException('Không có phòng này');
    }

    // 3. Check số lượng khách không được vượt quá quy định của phòng
    if (so_luong_khach > phong.khach) {
      throw new BadRequestException(
        `Số lượng khách vượt quá sức chứa của phòng (tối đa ${phong.khach})`,
      );
    }

    // 4. ✅ Check phòng bị được đặt trùng ngày
    const conflictBooking = await this.prisma.datphong.findFirst({
      where: {
        ma_phong,
        trang_thai: {
          in: [datphong_trang_thai.pending, datphong_trang_thai.confirmed],
        },
        NOT: [{ ngay_di: { lte: checkIn } }, { ngay_den: { gte: checkOut } }],
      },
    });

    if (conflictBooking) {
      throw new BadRequestException(
        'Phòng đã được đặt trong khoảng thời gian này',
      );
    }

    // 5. Tính toán tổng tiền
    // Tính số ngày (mili giây -> ngày)
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; // Nếu là 0 thì mặc định tính 1, vì có khách đến & đi trong ngày thì vẫn tính tròn 1 ngày.
    const tong_tien = diffDays * phong.gia_tien;

    // 6. Đặt/tạo phòng với tong_tien
    const booking = await this.prisma.datphong.create({
      data: {
        ma_phong,
        ngay_den: checkIn,
        ngay_di: checkOut,
        so_luong_khach,
        tong_tien, // lưu tổng tiền vào db
        ma_nguoi_dat: currentUser.id,
        trang_thai: datphong_trang_thai.pending,
      },
    });

    return {
      message: 'Đặt phòng thành công!',
      data: booking,
    };
  }

  // UPDATE STATUS CỦA ĐẶT PHÒNG
  async updateStatus(
    id: number,
    updateBookingStatusDto: UpdateBookingStatusDto,
  ) {
    const { trang_thai } = updateBookingStatusDto;

    // Kiểm tra đơn đặt phòng có tồn tại không
    const booking = await this.prisma.datphong.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Không tìm thấy đơn đặt phòng');

    const updatedBooking = await this.prisma.datphong.update({
      where: { id },
      data: { trang_thai },
    });

    return {
      message: `Đã chuyển trạng thái sang: ${trang_thai}`,
      data: updatedBooking,
    };
  }

  // ADMIN UPDATE STATUS
  async adminUpdate(id: number, dto: UpdateBookingByAdminDto) {
    // const { ma_phong, ngay_den, ngay_di, so_luong_khach } = dto;

    // 0. Kiểm tra có tồn tại booking không?
    const currentBooking = await this.prisma.datphong.findUnique({
      where: { id },
    });
    if (!currentBooking)
      throw new NotFoundException('Đơn đặt phòng không tồn tại');

    // 1. Nếu có đổi ngày hoặc đổi phòng, phải check conflict lại
    if (dto.ngay_den || dto.ngay_di || dto.ma_phong) {
      const ma_phong = dto.ma_phong || currentBooking.ma_phong;
      const checkIn = dto.ngay_den
        ? new Date(dto.ngay_den)
        : currentBooking.ngay_den;
      const checkOut = dto.ngay_di
        ? new Date(dto.ngay_di)
        : currentBooking.ngay_di;

      // 1.1 Kiểm tra conflict booking
      const conflict = await this.prisma.datphong.findFirst({
        where: {
          id: { not: id }, // Loại trừ chính đơn đang sửa này
          ma_phong,
          trang_thai: {
            in: [datphong_trang_thai.pending, datphong_trang_thai.confirmed],
          },
          NOT: [{ ngay_di: { lte: checkIn } }, { ngay_den: { gte: checkOut } }],
        },
      });

      if (conflict)
        throw new BadRequestException(
          'Thời gian/Phòng mới bị trùng lịch với đơn khác',
        );
    }

    // 2. update booking (xác nhận booking)
    const updated = await this.prisma.datphong.update({
      where: { id },
      data: {
        ...dto,
        ngay_den: dto.ngay_den ? new Date(dto.ngay_den) : undefined,
        ngay_di: dto.ngay_di ? new Date(dto.ngay_di) : undefined,
      },
    });

    return {
      message: 'Admin cập nhật thành công',
      data: updated,
    };
  }

  // NGƯỜI DÙNG TỰ HỦY BOOKING CỦA CHÍNH MÌNH
  async cancel(id: number, currentUser: AuthUser) {
    const booking = await this.prisma.datphong.findUnique({ where: { id } });

    // 0. Nếu không tồn tại thông tin booking
    if (!booking)
      throw new NotFoundException('Không tìm thấy thông tin đặt phòng.');

    // 1. Chỉ cancel chính booking của mình, không đc cancel booking của người khác
    if (booking.ma_nguoi_dat !== currentUser.id)
      throw new ForbiddenException('Bạn không có quyền hủy đơn của người khác');

    // 2. Nếu trạng thái booking = confirmed thì không đc hủy (tùy chính sách hotel).
    if (booking.trang_thai === datphong_trang_thai.confirmed) {
      // Tùy chính sách, có thể không cho hủy nếu đã Confirm
      throw new BadRequestException(
        'Đơn đã xác nhận, vui lòng liên hệ Admin để hủy',
      );
    }

    // 3. Update status của booking thành canceled (canceled booking)
    await this.prisma.datphong.update({
      where: { id },
      data: { trang_thai: datphong_trang_thai.cancelled },
    });

    return { message: 'Hủy phòng thành công' };
  }

  // 1. ADMIN XÁC NHẬN/DUYỆT BOOKING
  async confirmBooking(id: number) {
    // 1. Kiểm tra đơn đặt phòng có tồn tại không
    const booking = await this.prisma.datphong.findUnique({
      where: { id },
      select: { id: true, trang_thai: true, ma_phong: true },
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy booking này');
    }

    // 2. Kiểm tra trạng thái hiện tại
    // Nếu đơn đã bị hủy hoặc đã hoàn thành thì không thể duyệt lại
    if (booking.trang_thai === 'cancelled') {
      throw new BadRequestException('Không thể duyệt booking đã bị hủy');
    }

    if (booking.trang_thai === 'confirmed') {
      throw new BadRequestException('Booking này đã được duyệt trước đó');
    }

    // 3. Cập nhật trạng thái sang Confirmed
    const updatedBooking = await this.prisma.datphong.update({
      where: { id },
      data: {
        trang_thai: datphong_trang_thai.confirmed,
        updated_at: new Date(), // update thời gian chỉnh sửa
      },
    });

    return {
      message: 'Xác nhận booking thành công!',
      data: updatedBooking,
    };
  }

  // 2. CHECK-IN process
  async checkInBooking(id: number) {
    // 1. Kiểm tra booking có tồn tại không
    const booking = await this.prisma.datphong.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy booking này');
    }

    // 2. Logic nghiệp vụ: Chỉ cho phép Check-in khi đơn đã được Confirmed
    // Nếu đang ở trạng thái Pending, phải yêu cầu Admin Duyệt đơn trước
    if (booking.trang_thai !== datphong_trang_thai.confirmed) {
      throw new BadRequestException(
        `Không thể check-in. Trạng thái hiện tại là ${booking.trang_thai}, booking cần được 'confirmed' trước.`,
      );
    }

    // 3. Cập nhật trạng thái sang checked_in
    const updatedBooking = await this.prisma.datphong.update({
      where: { id },
      data: {
        trang_thai: datphong_trang_thai.checked_in,
        updated_at: new Date(),
      },
    });

    return {
      message: 'Khách hàng đã nhận phòng thành công!',
      data: updatedBooking,
    };
  }

  // 3. XỬ LÝ COMPLETED - KHÁCH TRẢ PHÒNG - THANH TOÁN
  async completeBooking(id: number) {
    // 1. Kiểm tra đơn đặt phòng
    const booking = await this.prisma.datphong.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy đơn đặt phòng');
    }

    // 2. Logic nghiệp vụ: Khách phải đang ở trong phòng (checked_in) thì mới trả phòng được
    if (booking.trang_thai !== datphong_trang_thai.checked_in) {
      throw new BadRequestException(
        `Không thể hoàn thành. Đơn hàng đang ở trạng thái ${booking.trang_thai}, cần phải 'checked_in' trước.`,
      );
    }

    // 3. Cập nhật sang completed
    const updatedBooking = await this.prisma.datphong.update({
      where: { id },
      data: {
        trang_thai: datphong_trang_thai.completed,
        updated_at: new Date(),
      },
    });

    return {
      message: 'Khách hàng đã trả phòng. Giao dịch hoàn tất!',
      data: updatedBooking,
    };
  }
}
