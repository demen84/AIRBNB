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
  @ApiProperty({ example: 'hoang@gmail.com' })
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({ example: 'Hoang@123' })
  @IsNotEmpty()
  @IsString()
  // @IsUppercase()
  @MinLength(6)
  pass_word: string;
}
