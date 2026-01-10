import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  ForbiddenException,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { DatphongService } from './datphong.service';
import { CreateDatphongDto } from './dto/create-datphong.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import type { AuthUser } from 'src/common/interface/auth-user.interface';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ProtectGuard } from 'src/common/guard/protect/protect.guard';
import { RolesGuard } from 'src/common/guard/protect/roles.guard';
import { UpdateBookingStatusDto } from './dto/update-bookingstatus.dto';
import { UpdateBookingByAdminDto } from './dto/update-booking-by-admin.dto';

@ApiTags('Đặt Phòng (Booking)')
@Controller('datphong')
export class DatphongController {
  constructor(private readonly datphongService: DatphongService) {}

  @Post()
  @ApiBearerAuth() // Bật Lock symbol
  @ApiOperation({ summary: 'Đặt phòng' })
  @ApiResponse({ status: 200, description: 'Đặt phòng thành công' })
  create(
    @Body() createDatphongDto: CreateDatphongDto,
    // @Req() req: Request, // lấy user từ token
    @CurrentUser() currentUser: AuthUser,
  ) {
    // const currentUser = req.user as AuthUser;
    // if (!currentUser) {
    //   throw new ForbiddenException('Không tìm thấy người dùng');
    // }

    return this.datphongService.create(createDatphongDto, currentUser);
  }

  // Cập nhật trạng thái đơn đặt phòng (Dành cho Admin)
  @Patch('update-status/:id')
  @ApiBearerAuth()
  @Roles('admin') // Chỉ quyền admin
  @UseGuards(ProtectGuard, RolesGuard)
  @ApiOperation({
    summary:
      'Cập nhật trạng thái đơn đặt phòng (Confirm, Check-in, Cancel ...)',
  })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBookingStatusDto: UpdateBookingStatusDto,
  ) {
    return this.datphongService.updateStatus(id, updateBookingStatusDto);
  }

  // Admin có thể sửa toàn bộ thông tin đơn đặt phòng
  @Patch('admin-update/:id')
  @ApiBearerAuth()
  @Roles('admin') // Chỉ quyền admin
  @UseGuards(ProtectGuard, RolesGuard)
  @ApiOperation({ summary: 'Admin chỉnh sửa toàn bộ thông tin đơn đặt phòng' })
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
  completeBooking(@Param('id', ParseIntPipe) id: number) {
    return this.datphongService.completeBooking(id);
  }
}
