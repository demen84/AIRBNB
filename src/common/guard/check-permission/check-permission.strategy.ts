import { Strategy } from 'passport-custom';
import { PassportStrategy } from '@nestjs/passport';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ACCESS_TOKEN_SECRET } from 'src/common/constant/app.constant';
import { PrismaService } from 'src/modules-system/prisma/prisma.service';

@Injectable()
export class CheckPermisionStrategy extends PassportStrategy(
  Strategy,
  'check-permission',
) {
  // 2: custom
  constructor(private readonly prisma: PrismaService) {
    super(); // Không làm gì cả
  }

  // 3: Chỉ chạy khi kiểm tra token thành công
  async validate(req: any) {
    const user = req.user;
    if (!user) {
      throw new BadRequestException(
        'Không có user ở Protect, thêm protect ở trước',
      );
    }

    if (user.role === 'user') {
      return req.user;
    }

    const method = req.method;
    const endpoint = req.baseUrl + req.route?.path;

    const rolePermission = await this.prisma.nguoidung.findFirst({
      where: {
        role: user.role,
        // Permissions: {
        //   method: method,
        //   endpoint: endpoint,
        // },
        // isActive: true, => do bảng nguoidung ko có field isActive nên rào lại
      },
    });

    if (!rolePermission) {
      console.log('check-permission', {
        method: method,
        endpoint,
        roleId: user.roleId,
      });
      throw new BadRequestException('Người dùng không đủ quyền');
    }
    /**
     * phải return về req.user => để user trong hàm handleRequest nhận được req.user
     * nếu return true thì bên hàm handleRequest sẽ chỉ nhận đc giá trị là true, khi đó tham số user chỉ nhận là true, và trả về true, ko có thông tin user.
     */
    return req.user;
  }
}
