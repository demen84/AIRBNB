import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProtectGuard } from 'src/common/guard/protect/protect.guard';
import { RolesGuard } from 'src/common/guard/protect/roles.guard';

@ApiTags('Dashboard báo cáo thống kê')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('dashboard')
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
}
