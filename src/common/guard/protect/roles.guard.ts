import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from 'src/common/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Lấy danh sách roles yêu cầu từ Decorator @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Nếu API không đặt @Roles, cho phép truy cập (nếu đã qua AuthGuard)
    if (!requiredRoles) {
      return true;
    }

    // 2. Lấy thông tin user từ request (đã được gán bởi AuthGuard/ProtectStrategy)
    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException(
        'Bạn cần đăng nhập để thực hiện hành động này',
      );
    }

    // 3. Kiểm tra xem role của user có nằm trong danh sách được phép không
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        'Bạn không có quyền admin để thực hiện hành động này',
      );
    }

    return true;
  }
}
