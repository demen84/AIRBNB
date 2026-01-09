import { IsEnum } from 'class-validator';
import { datphong_trang_thai } from '../../../modules-system/prisma/generated/prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBookingStatusDto {
    @ApiProperty({ example: 'Confirmed', description: 'Update trạng thái đặt phòng.' })
    @IsEnum(datphong_trang_thai)
    trang_thai: datphong_trang_thai;
}
