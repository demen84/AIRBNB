import {
  IsOptional,
  IsString,
  Length,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateNguoidungDto {
  @ApiProperty({
    example: 'Nguyễn Văn A',
    description: 'Họ và tên người dùng',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(2, 150)
  name?: string;

  @ApiProperty({
    example: '0912345678',
    description: 'Số điện thoại',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(10, 30)
  phone?: string;

  @ApiProperty({
    example: '1995-05-20',
    description: 'Ngày sinh (định dạng YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsString()
  birth_day?: string;

  @ApiProperty({
    example: 'nam',
    description: 'Giới tính: nam | nữ | khác',
    enum: ['nam', 'nữ', 'khác'],
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsEnum(['nam', 'nữ', 'khác'])
  gender?: string;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'Link ảnh đại diện',
    required: false,
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  // Không cho phép update các trường nhạy cảm qua route này:
  // - email: thường đã xác thực, không cho thay đổi dễ dàng
  // - pass_word: phải có route riêng (change-password) với xác thực cũ
  // - role: chỉ admin mới được thay đổi (nếu cần)
}
