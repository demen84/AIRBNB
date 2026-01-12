import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import { PaginationQueryDto } from "./query.dto";

export class SearchRoomDto extends PaginationQueryDto {
    @ApiProperty({ required: false })
    @IsOptional()
    ma_vi_tri?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    so_khach?: number;

    @ApiProperty({ required: false, example: '2026-01-15' })
    @IsOptional()
    ngay_den?: string;

    @ApiProperty({ required: false, example: '2026-01-20' })
    @IsOptional()
    ngay_di?: string;
}