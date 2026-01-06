import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsLowercase, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'tam@gmail.com', description: 'Email phải hợp lệ' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsString()
  @IsLowercase({ message: 'Email phải nhập chữ thường, không dấu' })
  email: string;

  @ApiProperty({
    example: 'Tamg@123', description:
      'Mật khẩu ít nhất 8 ký tự, phải có ít nhất 1 chữ hoa, 1 chữ thường, 1 ký số và 1 ký tự đặc biệt'
  })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString()
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/, {
    message:
      'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt',
  })
  pass_word: string;

  @ApiProperty({ example: 'Le Van Tam', description: 'Họ và tên đầy đủ' })
  // @IsOptional() // Vì họ tên là bắt buộc.
  @IsNotEmpty({ message: 'Tên người dùng không được để trống' })
  @IsString()
  @MinLength(2, { message: 'Họ tên phải có ít nhất 2 ký tự' })
  @MaxLength(100, { message: 'Họ tên không được quá 100 ký tự' })
  @Matches(/^(?!\s*$).+/, { message: 'Họ tên không được chỉ chứa khoảng trắng' })
  name: string;
}
