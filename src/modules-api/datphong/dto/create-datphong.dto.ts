import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNotEmpty, IsNumber, Max, Min } from 'class-validator';

export class CreateDatphongDto {
    @ApiProperty({ example: '1', description: 'Mã phòng' })
    @IsNotEmpty()
    @IsInt()
    // @IsNumber()
    ma_phong: number;

    @ApiProperty({ example: '2026-01-01', description: 'Ngày nhận phòng (Năm-Tháng-Ngày' })
    @IsNotEmpty()
    @IsDateString()
    ngay_den: string;

    @ApiProperty({ example: '2026-01-03', description: 'Ngày trả phòng (Năm-Tháng-Ngày' })
    @IsNotEmpty()
    @IsDateString()
    ngay_di: string;

    @ApiProperty({ example: '2', description: 'Số lượng khách' })
    @IsNotEmpty()
    @IsInt()
    @Min(1)
    @Max(10)
    @Type(() => Number)
    so_luong_khach: number;

    // ma_nguoi_dat → lấy từ JWT / user đăng nhập
    // trang_thai → mặc định pending
}
