import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'huong@gmail.com' })
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({ example: 'Huong@123' })
  @IsNotEmpty()
  @IsString()
  pass_word: string;

  @ApiProperty({ example: 'Hoàng Cẩm Hường' })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  name: string;
}
