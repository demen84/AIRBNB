import {
    IsInt,
    IsDateString,
    Min,
    IsOptional,
    IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { datphong_trang_thai } from '../../../modules-system/prisma/generated/prisma/client';

export class UpdateBookingByAdminDto {
    @IsOptional()
    @IsInt()
    ma_phong?: number;

    @IsOptional()
    @IsDateString()
    ngay_den?: string;

    @IsOptional()
    @IsDateString()
    ngay_di?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    so_luong_khach?: number;

    @IsOptional()
    @IsEnum(datphong_trang_thai)
    trang_thai?: datphong_trang_thai;
}
