import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ACCESS_TOKEN_SECRET } from 'src/common/constant/app.constant';
import { PrismaService } from 'src/modules-system/prisma/prisma.service';

@Injectable()
export class ProtectStrategy extends PassportStrategy(Strategy, 'protect') {
  // 2: kiểm tra token
  constructor(private readonly prisma: PrismaService) {
    // super gọi constructor của hàm PassportStrategy
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Kiểm tra hạn sử dụng
      secretOrKey: ACCESS_TOKEN_SECRET as string,
    });
  }

  // 3: Chỉ chạy khi kiểm tra token thành công
  async validate(decode: any) {
    console.log('Validate', decode);
    if (!decode?.userId) {
      throw new UnauthorizedException('Token không hợp lệ.');
    }
    const userExist = await this.prisma.nguoidung.findUnique({
      where: {
        id: decode.userId,
      },
      // select: {
      //   id: true, name: true, email: true, avatar: true, gender: true, phone: true, role: true, birth_day: true
      // }
    });
    if (!userExist) {
      throw new UnauthorizedException('Người dùng không hợp lệ');
    }

    return userExist;
  }
}
