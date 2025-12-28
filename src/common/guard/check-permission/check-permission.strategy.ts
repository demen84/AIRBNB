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
    super();
  }

  // 3: Chỉ chạy khi kiểm tra token thành công
  async validate(req: any) {
    const user = req.user;
    if (!user) {
      throw new BadRequestException(
        'Không có user ở Protect, thêm protect ở trước',
      );
    }

    if (user.roleId === 1) {
      return req.user;
    }

    const method = req.method;
    const endpoint = req.baseUrl + req.route?.path;

    const rolePermission = await this.prisma.rolePermission.findFirst({
      where: {
        roleId: user.roleId,
        Permissions: {
          method: method,
          endpoint: endpoint,
        },
        isActive: true,
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
    return req.user;
  }
}
