import { IsEnum, IsNotEmpty } from 'class-validator';
import { datphong_trang_thai } from '../../../modules-system/prisma/generated/prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateBookingStatusDto {
    // @ApiProperty(
    //     {
    //         example: 'confirmed',
    //         description: 'Trạng thái booking (Sẽ tự động chuyển về chữ thường)'
    //     })
    // @Transform(({ value }) => value?.trim().toLowerCase())
    // @IsEnum(datphong_trang_thai, { message: 'Trạng thái phải là: pending, confirmed, checked_in, completed, cancelled' })
    // @IsNotEmpty({ message: 'Trạng thái không được để trống' })
    // trang_thai: datphong_trang_thai;

    @ApiProperty({
        description: 'Chuyển trạng thái booking sang:',
        enum: datphong_trang_thai, // Truyền Enum vào đây
        example: datphong_trang_thai.confirmed,
        required: true
    })
    @IsEnum(datphong_trang_thai)
    trang_thai: datphong_trang_thai;
}
