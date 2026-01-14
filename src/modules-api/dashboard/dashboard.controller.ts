import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';

@ApiTags('Dashboard báo cáo thống kê')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get('dashboard')
  @ApiOperation({ summary: 'Báo cáo doanh thu' })
  @ApiBearerAuth()
  @Roles('admin')
  // @UseGuards(ProtectGuard, RolesGuard)
  async getFullDashboard() {
    const [metrics, locationRevenue, bookingStats] = await Promise.all([
      this.dashboardService.getLiveMetrics(),
      this.dashboardService.getRevenueByLocation(),
      this.dashboardService.getBookingStatusStats(),
    ]);

    return {
      thongBao: 'Lấy dữ liệu Dashboard thành công',
      data: {
        metrics,
        locationRevenue,
        bookingStats,
      },
    };
  }

  @Get('guest-stats')
  @ApiOperation({ summary: 'Báo cáo tổng số khách sử dụng dịch vụ tại AirBNB' })
  @ApiBearerAuth()
  @Roles('admin')
  async getGuestStats(
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.dashboardService.getGuestStatistics(Number(month), Number(year));
  }
}
