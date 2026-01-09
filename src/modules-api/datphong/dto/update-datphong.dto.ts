import {
    IsDateString,
    IsInt,
    Min,
    IsOptional,
    IsNotEmpty,
    Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDatphongDto {
    @ApiProperty({ example: '2026-01-01', description: 'Ngày nhận phòng (Năm-Tháng-Ngày' })
    @IsOptional()
    @IsDateString()
    ngay_den?: string;

    @ApiProperty({ example: '2026-01-03', description: 'Ngày trả phòng (Năm-Tháng-Ngày' })
    @IsOptional()
    @IsDateString()
    ngay_di?: string;

    @ApiProperty({ example: '2', description: 'Số lượng khách' })
    @IsOptional()
    @IsInt()
    @Min(1) @Max(10)
    @Type(() => Number)
    so_luong_khach?: number;
}
