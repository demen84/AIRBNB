import { Injectable } from '@nestjs/common';
import { datphong_trang_thai } from 'src/modules-system/prisma/generated/prisma/enums';
import { PrismaService } from 'src/modules-system/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getLiveMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [revenueToday, newBookings, occupiedRooms, totalRooms] =
      await Promise.all([
        // 1. Doanh thu hôm nay
        this.prisma.datphong.aggregate({
          where: {
            created_at: { gte: today },
            trang_thai: { in: ['confirmed', 'checked_in', 'completed'] },
          },
          _sum: { tong_tien: true },
        }),
        // 2. Số booking mới
        this.prisma.datphong.count({ where: { created_at: { gte: today } } }),
        // 3. Số phòng đang bận
        this.prisma.datphong.count({
          where: { trang_thai: 'checked_in' },
        }),
        // 4. Tổng số phòng
        this.prisma.phong.count(),
      ]);

    return {
      revenueToday: Number(revenueToday._sum.tong_tien || 0), // doanh thu hôm nay
      newBookings, // booking mới
      occupancyRate: // Tỉ lệ lấp đầy phòng
        totalRooms > 0
          ? Number(((occupiedRooms / totalRooms) * 100).toFixed(1))
          : 0,
    };
  }

  async getRevenueByLocation() {
    const stats = await this.prisma.vitri.findMany({
      select: {
        ten_vi_tri: true,
        phong: {
          select: {
            datphong: {
              where: { trang_thai: 'completed' },
              select: { tong_tien: true },
            },
          },
        },
      },
    });

    const result = stats
      .map((loc) => {
        const total = loc.phong.reduce((sum, p) => {
          // p.datphong là một mảng các booking, d.tong_tien cần ép kiểu Number
          const roomRevenue = p.datphong.reduce(
            (s, d) => s + Number(d.tong_tien || 0),
            0,
          );
          return sum + roomRevenue;
        }, 0);
        return {
          vi_tri: loc.ten_vi_tri,
          doanh_thu: total,
        };
      })
      .sort((a, b) => b.doanh_thu - a.doanh_thu);

    return result;
  }

  async getBookingStatusStats() {
    const stats = await this.prisma.datphong.groupBy({
      by: ['trang_thai'],
      _count: { id: true },
    });

    return stats.map((dp) => ({
      status: dp.trang_thai,
      count: dp._count.id,
    }));
  }

  // BÁO CÁO TỔNG SỐ KHÁCH
  async getGuestStatistics(month: number, year: number) {
    // 1. Tạo khoảng thời gian bắt đầu và kết thúc của tháng đó
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59); // Ngày cuối cùng của tháng

    // Lấy tất cả đơn đặt phòng đã hoàn tất trong khoảng thời gian này
    const completedBookings = await this.prisma.datphong.findMany({
      where: {
        trang_thai: datphong_trang_thai.completed,
        ngay_den: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        phong: {
          select: { ten_phong: true },
        },
      },
    });

    // --- BÁO CÁO 1: Tổng số khách của từng phòng ---
    const guestsByRoom = completedBookings.reduce((acc, booking) => {
      const roomId = booking.ma_phong;
      const roomName = booking.phong?.ten_phong || `Phòng ${roomId}`;
      const guestCount = booking.so_luong_khach || 0;

      if (!acc[roomId]) {
        acc[roomId] = { ma_phong: roomId, ten_phong: roomName, tong_khach: 0 };
      }
      acc[roomId].tong_khach += guestCount;
      return acc;
    }, {});

    // Chuyển object thành array để dễ hiển thị
    const reportByRoom = Object.values(guestsByRoom);

    // --- BÁO CÁO 2: Tổng số khách đến Airbnb (toàn hệ thống) ---
    const totalGuestsSystem = completedBookings.reduce((sum, booking) => {
      return sum + (booking.so_luong_khach || 0);
    }, 0);

    return {
      thoi_gian: `${month}/${year}`,
      tong_khach_toan_he_thong: totalGuestsSystem,
      chi_tiet_tung_phong: reportByRoom,
    };
  }
}
