/**
 * Quản lý luồng BOOKING như sau:
 * Pending/Confirmed (Admin xác nhận)
 * Confirmed/Checked_in (Khách đến nhận phòng)
 * Checked_in - Completed (Khách trả phòng - Kết thúc)
 * Pending/Confirmed/Cancelled (Hủy đơn)
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { DatphongService } from './datphong.service';
import { CreateDatphongDto } from './dto/create-datphong.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
// import type { Request } from 'express';
import type { AuthUser } from 'src/common/interface/auth-user.interface';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
// import { ProtectGuard } from 'src/common/guard/protect/protect.guard';
// import { RolesGuard } from 'src/common/guard/protect/roles.guard';
import { UpdateBookingStatusDto } from './dto/update-bookingstatus.dto';
import { UpdateBookingByAdminDto } from './dto/update-booking-by-admin.dto';
import { TOP_ROOM_BOOKED } from 'src/common/constant/app.constant';
import { datphong_trang_thai } from 'src/modules-system/prisma/generated/prisma/enums';

@ApiTags('Đặt Phòng (Booking)')
@Controller('datphong')
export class DatphongController {
  constructor(private readonly datphongService: DatphongService) { }

  // TẠO BOOKING
  @Post()
  @ApiBearerAuth() // Bật Lock symbol
  @ApiOperation({ summary: 'Đặt phòng' })
  @ApiResponse({ status: 200, description: 'Đặt phòng thành công' })
  create(
    @Body() createDatphongDto: CreateDatphongDto,
    // @Req() req: Request, // lấy user từ token
    @CurrentUser() currentUser: AuthUser,
  ) {
    return this.datphongService.create(createDatphongDto, currentUser);
  }

  // UPDATE BOOKING STATUS (Dành cho Admin)
  @Patch('update-status/:id')
  @ApiBearerAuth()
  @Roles('admin') // Chỉ quyền admin
  // @UseGuards(ProtectGuard, RolesGuard)
  @ApiOperation({
    summary:
      'Cập nhật trạng thái đơn đặt phòng (confirmed, checked-in, completed, cancelled, pending)',
  })
  @ApiParam(
    {
      name: 'id',
      description: 'Mã đặt phòng (Booking ID)',
      type: Number,
      example: 1,
    }
  )
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    // @Body() updateBookingStatusDto: UpdateBookingStatusDto,
    @Query() updateBookingStatusDto: UpdateBookingStatusDto
  ) {
    return this.datphongService.updateStatus(id, updateBookingStatusDto);
  }

  // Admin có thể sửa toàn bộ thông tin booking
  @Patch('admin-update/:id')
  @ApiBearerAuth()
  @Roles('admin') // Chỉ quyền admin
  // @UseGuards(ProtectGuard, RolesGuard)
  @ApiOperation({ summary: 'Admin chỉnh sửa toàn bộ thông tin đơn đặt phòng' })
  @ApiParam({
    name: 'id',
    description: 'Mã đặt phòng (Booking ID)',
    type: Number,
    example: 1,
  })
  adminUpdate(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBookingByAdminDto: UpdateBookingByAdminDto,
  ) {
    return this.datphongService.adminUpdate(id, updateBookingByAdminDto);
  }

  // NGƯỜI DÙNG TỰ HỦY BOOKING PHÒNG
  @Delete('cancel/:id')
  @ApiBearerAuth()
  // @UseGuards(ProtectGuard)
  @ApiOperation({ summary: 'Người dùng tự hủy đặt phòng của chính mình' })
  @ApiParam({
    name: 'id',
    description: 'Mã đặt phòng (Booking ID)',
    type: Number,
    example: 1,
  })
  cancel(
    @Param('id', ParseIntPipe) id: number, // id của table datphong
    @CurrentUser() currentUser: AuthUser, // Lấy thông tin người dùng
  ) {
    return this.datphongService.cancel(id, currentUser);
  }

  // CONFIRMED BOOKING
  @Patch('confirm/:id')
  @ApiBearerAuth()
  @Roles('admin') // Chỉ Admin mới có quyền duyệt đơn
  // @UseGuards(ProtectGuard, RolesGuard)
  @ApiOperation({ summary: '1. Xác nhận booking (chuyển sang Confirmed)' })
  @ApiResponse({ status: 200, description: 'Xác nhận booking thành công' })
  @ApiParam({
    name: 'id',
    description: 'Mã đặt phòng (Booking ID)',
    type: Number,
    example: 1,
  })
  confirmBooking(
    @Param('id', ParseIntPipe) id: number, // id của table datphong
  ) {
    return this.datphongService.confirmBooking(id);
  }

  // CHECK-IN (KHÁCH NHẬN PHÒNG)
  @Patch('check-in/:id')
  @ApiBearerAuth() // Bật Lock symbol
  @Roles('admin') // chỉ quyền admin
  @ApiOperation({ summary: '2. Nhận phòng (chuyển sang Checked_in)' })
  @ApiResponse({ status: 200, description: 'Check-in thành công' })
  @ApiParam({
    name: 'id',
    description: 'Mã đặt phòng (Booking ID)',
    type: Number,
    example: 1,
  })
  checkInBooking(@Param('id', ParseIntPipe) id: number) {
    return this.datphongService.checkInBooking(id);
  }

  // CHỐT SỔ PHÒNG (COMPLETED) KHI KHÁC TRẢ PHÒNG - THANH TOÁN
  @Patch('complete/:id')
  @ApiBearerAuth()
  @Roles('admin')
  @ApiOperation({
    summary: '3. Trả phòng & Hoàn thành (Chuyển sang Completed)',
  })
  @ApiResponse({
    status: 200,
    description: 'Check-out và hoàn thành đơn thành công',
  })
  @ApiParam({
    name: 'id',
    description: 'Mã đặt phòng (Booking ID)',
    type: Number,
    example: 1,
  })
  completeBooking(@Param('id', ParseIntPipe) id: number) {
    return this.datphongService.completeBooking(id);
  }

  // THỐNG KÊ DOANH THU THEO NĂM/THÁNG
  @Get('thong-ke-doanh-thu/:year')
  @ApiBearerAuth()
  @Roles('admin')
  @ApiOperation({ summary: 'Thống kê doanh thu theo 12 tháng trong năm' })
  @ApiParam({
    name: 'year',
    description: 'Nhập năm cần thống kê',
    type: Number,
    example: 2026,
  })
  getRevenueByYearRaw(@Param('year', ParseIntPipe) year: number) {
    // return this.datphongService.getRevenueByYear(year);
    // return this.datphongService.getRevenueByYearGroupBy(year);
    return this.datphongService.getRevenueByYearRaw(year);
  }

  // THỐNG KÊ TOP 5 PHÒNG ĐƯỢC ĐẶT NHIỀU NHẤT
  @Get('top-phong')
  @ApiBearerAuth()
  @Roles('admin')
  @ApiOperation({ summary: `Thống kê Top ${TOP_ROOM_BOOKED} phòng được đặt nhiều nhất` })
  getTopRooms() {
    return this.datphongService.getTopRooms();
  }
}
