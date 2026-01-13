import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsNotEmpty, Max, Min } from 'class-validator';
import { IsAfter } from 'src/common/decorators/is-after.decorator';

export class CreateDatphongDto {
    @ApiProperty({ example: 1, description: 'Mã phòng' })
    @IsNotEmpty()
    @IsInt()
    @Type(() => Number) // Đảm bảo luôn là số
    ma_phong: number;

    @ApiProperty({ example: '2026-01-01', description: 'Ngày nhận phòng (YYYY-MM-DD)' })
    @IsNotEmpty()
    @Type(() => Date) // Chuyển chuỗi từ client gửi lên thành object Date
    @IsDate({ message: 'Ngày đến không đúng định dạng ngày tháng' })
    ngay_den: Date;

    @ApiProperty({ example: '2026-01-03', description: 'Ngày trả phòng (YYYY-MM-DD)' })
    @IsNotEmpty()
    @Type(() => Date) // Chuyển chuỗi từ client gửi lên thành object Date
    @IsDate({ message: 'Ngày đi không đúng định dạng ngày tháng' })
    @IsAfter('ngay_den', { message: 'Ngày đi phải sau Ngày đến' })
    ngay_di: Date;

    @ApiProperty({ example: 2, description: 'Số lượng khách' })
    @IsNotEmpty({ message: 'Số lượng khách không được để trống' })
    @IsInt({ message: 'Số lượng khách phải là số nguyên' }) // <== Tối ưu nhất ở đây
    @Min(1, { message: 'Ít nhất phải có 1 khách' })
    @Max(20, { message: 'Số lượng khách quá lớn' })
    @Type(() => Number) // Ép kiểu từ string sang number để validator hoạt động đúng
    so_luong_khach: number;

    // ma_nguoi_dat → lấy từ JWT / user đăng nhập
    // trang_thai → mặc định pending
}
