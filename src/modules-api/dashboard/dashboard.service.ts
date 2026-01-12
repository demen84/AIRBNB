import { Injectable } from '@nestjs/common';
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
        // 2. Số đơn mới
        this.prisma.datphong.count({ where: { created_at: { gte: today } } }),
        // 3. Số phòng đang bận
        this.prisma.datphong.count({
          where: { trang_thai: 'checked_in' },
        }),
        // 4. Tổng số phòng
        this.prisma.phong.count(),
      ]);

    return {
      revenueToday: Number(revenueToday._sum.tong_tien || 0),
      newBookings,
      occupancyRate:
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
          // p.datphong là một mảng các đơn đặt, d.tong_tien cần ép kiểu Number
          const roomRevenue = p.datphong.reduce(
            (s, d) => s + Number(d.tong_tien || 0),
            0,
          );
          return sum + roomRevenue;
        }, 0);
        return { location: loc.ten_vi_tri, revenue: total };
      })
      .sort((a, b) => b.revenue - a.revenue);

    return result;
  }

  async getBookingStatusStats() {
    const stats = await this.prisma.datphong.groupBy({
      by: ['trang_thai'],
      _count: { id: true },
    });

    return stats.map((item) => ({
      status: item.trang_thai,
      count: item._count.id,
    }));
  }
}
