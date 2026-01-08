import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

export class CreatePhongDto {
    @ApiProperty({ example: 'Phòng view biển 1.01', description: 'Diễn giải tên phòng' })
    @IsString()
    @IsNotEmpty({ message: 'Tên phòng không được để trống' })
    @MinLength(2, { message: 'Tên phòng tối thiểu 2 ký tự' })
    @MaxLength(255, { message: 'Tên phòng tối đa 255 ký tự' })
    ten_phong: string;

    @ApiProperty({ example: 'View biển cực chill, rộng rãi, đầy đủ tiện nghi', description: 'Mô tả phòng', required: false })
    @IsString()
    @IsOptional()
    @MinLength(2, { message: 'Mô tả tối thiểu 2 ký tự' })
    @MaxLength(1000, { message: 'Mô tả tối đa 1000 ký tự' })
    mo_ta: string;

    @ApiProperty({ example: '2', description: 'Số khách' })
    @IsNumber()
    @IsNotEmpty({ message: 'Số khách không được để trống' })
    @Min(1, { message: 'Số khách tối thiểu 1' })
    @Max(20, { message: 'Số khách tối đa 20' })
    khach: number;

    @ApiProperty({ example: '1', description: 'Số phòng ngủ' })
    @IsNumber()
    @IsNotEmpty({ message: 'Số phòng ngủ không được để trống' })
    @Min(1, { message: 'Số phòng ngủ tối thiểu 1' })
    @Max(4, { message: 'Số phòng ngủ tối đa 4' })
    phong_ngu: number;

    @ApiProperty({ example: '1', description: 'Số giường' })
    @IsNumber()
    @IsNotEmpty({ message: 'Số giường không được để trống' })
    @Min(1, { message: 'Số giường tối thiểu 1' })
    @Max(4, { message: 'Số giường tối đa 4' })
    giuong: number;

    @ApiProperty({ example: '1', description: 'Số phòng tắm' })
    @IsNumber()
    @IsNotEmpty({ message: 'Số phòng tắm không được để trống' })
    @Min(1, { message: 'Số phòng tắm tối thiểu 1' })
    @Max(4, { message: 'Số phòng tắm tối đa 4' })
    phong_tam: number;

    @ApiProperty({ example: '500000', description: 'Giá tiền/ngày đêm' })
    @IsNumber()
    @Min(0)
    @Max(10000000)
    gia_tien: number;

    @ApiProperty({ example: true, description: 'Có máy giặt hay không?' })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true || value === 1)
    may_giat: boolean;

    @ApiProperty({ example: true, description: 'Có tivi hay không?' })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true || value === 1)
    tivi: boolean;

    @ApiProperty({ example: true, description: 'Có máy lạnh hay không?' })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true || value === 1)
    dieu_hoa: boolean;

    @ApiProperty({ example: true, description: 'Có wifi hay không?' })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true || value === 1)
    wifi: boolean;

    @ApiProperty({ example: true, description: 'Có bếp hay không?' })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true || value === 1)
    bep: boolean;

    @ApiProperty({ example: true, description: 'Có bãi đậu xe hay không?' })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true || value === 1)
    do_xe: boolean;

    @ApiProperty({ example: true, description: 'Có hồ bơi hay không?' })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true || value === 1)
    ho_boi: boolean;

    @ApiProperty({ example: true, description: 'Có bàn ủi hay không?' })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true || value === 1)
    ban_ui: boolean;

    @ApiProperty({ example: '1', description: 'Mã vị trí phải tồn tại trong bảng vị trí' })
    @IsNumber()
    @IsNotEmpty({ message: 'Mã vị trí không được để trống' })
    ma_vi_tri: number;

    // hinh_anh sẽ được xử lý riêng ở phần upload
}
