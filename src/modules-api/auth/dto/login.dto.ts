import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUppercase,
  Min,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'hoang@gmail.com' }) // Tạo giá trị mặc định bên swagger
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({ example: 'Hoang@123' }) // Tạo giá trị mặc định bên swagger
  @IsNotEmpty()
  @IsString()
  // @IsUppercase()
  @MinLength(6)
  pass_word: string;
}
