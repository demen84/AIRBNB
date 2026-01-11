import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class CreateBinhluanDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  ma_phong: number;

  @ApiProperty({ description: 'Nội dung bình luận, dưới 2000 ký tự' })
  @IsString()
  @IsNotEmpty({ message: 'Nội dung khônd được để trống' })
  noi_dung: string;

  @ApiProperty({ description: 'Số sao đánh giá (từ 1 đến 5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  sao_binh_luan: number;
}
