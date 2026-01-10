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

  // XỬ LÝ THỐNG KÊ DOANH THU THEO NĂM
  async getRevenueByYear(year: number) {
    // 1. Lấy dữ liệu từ DB (Chỉ lấy các đơn đã hoàn thành trong năm được chọn)
    // Note: nếu data có hàng trăm nghìn, hàng triệu rows thì cách này rất tốn RAM, CPU
    const bookings = await this.prisma.datphong.findMany({
      where: {
        trang_thai: datphong_trang_thai.completed,
        ngay_di: {
          gte: new Date(`${year}-01-01T00:00:00.000Z`),
          lte: new Date(`${year}-12-31T23:59:59.999Z`),
        },
      },
      select: {
        tong_tien: true,
        ngay_di: true,
      },
    });

    // 2. Khởi tạo mảng 12 tháng với doanh thu bằng 0
    // Business rule: Luôn trả về đủ 12 tháng để Front-end vẽ biểu đồ
    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => ({
      thang: i + 1,
      doanh_thu: 0,
      so_luong_don: 0,
    }));

    // 3. Duyệt qua danh sách đơn hàng để cộng dồn vào từng tháng tương ứng
    bookings.forEach((booking) => {
      const month = new Date(booking.ngay_di).getMonth(); // getMonth() trả về 0-->11

      // Chuyển Decimal (Prisma) sang Number để tính toán
      const amount = booking.tong_tien ? Number(booking.tong_tien) : 0;

      monthlyRevenue[month].doanh_thu += amount;
      monthlyRevenue[month].so_luong_don += 1;
    });

    // 4. Tính tổng doanh thu cả năm
    const tong_doanh_thu_nam = monthlyRevenue.reduce(
      (sum, item) => sum + item.doanh_thu,
      0,
    );

    return {
      message: 'Thống kê doanh thu cả năm theo từng tháng',
      nam: year,
      tong_doanh_thu_nam,
      chi_tiet_thang: monthlyRevenue,
    };
  }

  // Cách 1: SỬ DỤNG GROUP BY CỦA PRISMA (tối ưu RAM & CPU)
  // Nếu dùng db khác (Mongo, PostgreSQL, ...) vì Prisma sẽ tự điều chỉnh câu lệnh SQL tương ứng
  async getRevenueByYearGroupBy(year: number) {
    // 1. Database tự tính tổng tiền và đếm số đơn theo từng ngày
    const stats = await this.prisma.datphong.groupBy({
      by: ['ngay_di'],
      _sum: { tong_tien: true },
      _count: { id: true },
      where: {
        trang_thai: datphong_trang_thai.completed,
        ngay_di: {
          gte: new Date(`${year}-01-01T00:00:00.000Z`),
          lte: new Date(`${year}-12-31T23:59:59.999Z`),
        },
      },
    });

    // 2. Khởi tạo mảng 12 tháng
    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => ({
      thang: i + 1,
      doanh_thu: 0,
      so_luong_don: 0,
    }));

    // 3. Gom dữ liệu từ các ngày vào các tháng tương ứng
    stats.forEach((item) => {
      const month = new Date(item.ngay_di).getMonth(); // 0-->11
      const amount = item._sum.tong_tien ? Number(item._sum.tong_tien) : 0;

      monthlyRevenue[month].doanh_thu += amount;
      monthlyRevenue[month].so_luong_don += item._count.id;
    });

    const tong_doanh_thu_nam = monthlyRevenue.reduce(
      (sum, item) => sum + item.doanh_thu,
      0,
    );

    return {
      message: 'Thống kê bằng Prisma GroupBy (Tối ưu RAM)',
      nam: year,
      tong_doanh_thu_nam,
      chi_tiet_thang: monthlyRevenue,
    };
  }

  // SỬ DỤNG SQL TRỰC TIẾP (tối ưu chỉ với MySQL)
  // Sẽ gặp lỗi cú pháp nếu dùng db khác (Mongo, PortgreSQL, ...)
  async getRevenueByYearRaw(year: number) {
    // 1. Chạy câu lệnh SQL thuần
    // Prisma sẽ tự động map các biến ${year} để chống SQL Injection
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT 
        MONTH(ngay_di) as thang, 
        SUM(tong_tien) as doanh_thu, 
        COUNT(id) as so_luong_don
      FROM datphong
      WHERE YEAR(ngay_di) = ${year} 
        AND trang_thai = ${datphong_trang_thai.completed}
      GROUP BY MONTH(ngay_di)
      ORDER BY thang ASC
    `;

    // 2. Chuẩn hóa lại data (vì SQL chỉ trả về những tháng có data)
    const fullYear = Array.from({ length: 12 }, (_, i) => {
      const monthIndex = i + 1;
      // Tìm trong kết quả SQL xem có tháng này không
      const found = result.find((q) => Number(q.thang) === monthIndex);

      return {
        thang: monthIndex,
        // ! Lưu ý quan trọng: Khi dùng Raw SQL, kết quả trả về thường là kiểu BigInt hoặc string. Vì vậy nên bọc Number(...) để đảm bảo tính toán chính xác trên Server.
        doanh_thu: found ? Number(found.doanh_thu) : 0,
        so_luong_don: found ? Number(found.so_luong_don) : 0,
      };
    });

    const tong_doanh_thu_nam = fullYear.reduce(
      (sum, item) => sum + item.doanh_thu,
      0,
    );

    return {
      message: 'Thống kê doanh thu bằng Raw SQL',
      nam: year,
      tong_doanh_thu_nam,
      chi_tiet_thang: fullYear,
    };
  }

  // THỐNG KÊ TOP 5 PHÒNG ĐƯỢC ĐẶT NHIỀU NHẤT
  async getTopRooms() {
    // 1. Group by ma_phong để đếm số lượt đặt (booking count)
    const roomStats = await this.prisma.datphong.groupBy({
      where: {
        trang_thai: datphong_trang_thai.completed,
        // ngay_den: { gte: firstDayOfMonth }
      },
      by: ['ma_phong'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc', // Sắp xếp từ nhiều đến ít
        },
      },
      take: 5, // Chỉ lấy Top 5
    });

    if (roomStats.length === 0) {
      return { message: 'Chưa có dữ liệu đặt phòng', data: [] };
    }

    // 2. Lấy danh sách ID phòng từ kết quả group để query chi tiết
    const topRoomIds = roomStats.map((item) => item.ma_phong);

    // 3. Lấy thông tin chi tiết của các phòng này
    const roomsDetail = await this.prisma.phong.findMany({
      where: {
        id: { in: topRoomIds },
      },
      select: {
        id: true,
        ten_phong: true,
        hinh_anh: true,
        gia_tien: true,
      },
    });

    // 4. Kết hợp dữ liệu lượt đặt vào thông tin phòng (vì findMany không đảm bảo thứ tự như groupBy)
    const result = roomStats
      .map((stat) => {
        const detail = roomsDetail.find((r) => r.id === stat.ma_phong);
        if (!detail) return null; // Loại bỏ trường hợp không tìm thấy (nếu có)
        return {
          ...detail,
          luot_dat: stat._count.id,
        };
      })
      .filter((item) => item !== null); // Lọc bỏ các giá trị null

    return {
      message: 'Top 5 phòng được đặt nhiều nhất',
      data: result,
    };
  }
}
