import { BadRequestException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsJSON,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';

export class PaginationQueryDto {
  @ApiProperty({
    description: 'Số trang (bắt đầu từ 1)',
    example: 1,
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber({}, { message: 'Phải là số nguyên' })
  @IsPositive()
  // @IsNotEmpty()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Số lượng item mỗi trang',
    example: 5,
    required: false,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber({}, { message: 'Phải là số nguyên' })
  // @IsNotEmpty()
  @Min(1)
  pageSize?: number = 5;

  @ApiProperty({
    description: 'Alias cho `pageSize` (hỗ trợ `limit` query param)',
    example: 5,
    required: false,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber({}, { message: 'Phải là số nguyên' })
  @Min(1)
  limit?: number;
  @ApiProperty({
    description: 'Nhập giá trị tìm kiếm',
    example: '',
    required: false,
  })
  @IsOptional()
  keyword?: string;

  @IsOptional()
  @IsJSON({ message: 'Filters phải là chuỗi JSON hợp lệ' })
  @Transform(({ value }) => {
    if (value) {
      try {
        return JSON.parse(value);
      } catch {
        throw new BadRequestException('Filters không phải JSON hợp lệ');
      }
    }
    return value;
  })
  filters?: Record<string, any>; // ? : có thể truyền or không truyền
}
