import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateVitriDto {
  @ApiProperty({ example: 'Quận 1', description: 'Tên vị trí cụ thể' })
  @IsString()
  @IsNotEmpty({ message: 'Tên vị trí không được để trống' })
  @MinLength(1)
  @MaxLength(255)
  ten_vi_tri: string;

  @ApiProperty({
    example: 'TP. Hồ Chí Minh',
    description: 'Tỉnh hoặc thành phố',
  })
  @IsString()
  @IsNotEmpty({ message: 'Tỉnh thành không được để trống' })
  @MinLength(1)
  @MaxLength(255)
  tinh_thanh: string;

  @ApiProperty({ example: 'Việt Nam', description: 'Quốc gia' })
  @IsString()
  @IsNotEmpty({ message: 'Quốc gia không được để trống' })
  @MinLength(1)
  @MaxLength(255)
  quoc_gia: string;

  // hinh_anh sẽ được xử lý riêng ở phần upload, tạm thời để trống hoặc IsOptional
}
