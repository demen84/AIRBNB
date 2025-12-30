import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';

// @Injectable()
export class ProtectGuard extends AuthGuard('protect') {
  //   private reflector: Reflector;
  constructor(private reflector: Reflector) {
    super(); // this.reflector = reflector;
  }
  // 1
  canActivate(context: ExecutionContext) {
    // hàm canActivate sẽ luôn luôn được chạy đầu tiên, để kiểm tra đầu vào xem api đó có muốn kiểm tra token hay không
    // nếu api đó được đánh dấu @Public thì chúng ta sẽ bỏ qua không kiểm tra token với api đó
    console.log('canActivate');
    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.
    const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    console.log({ isPublic });

    if (isPublic === true) {
      return true;
    }

    // return true;
    return super.canActivate(context);
  }

  // 4. thành công hay thất bại thì sẽ luôn luôn chạy cuối cùng
  handleRequest(err: any, user: any, info: any) {
    console.log('handleRequest', { err, user, info });
    // err: là lỗi có trong hệ thống do mình tạo ra (exception: BadRequestException)
    // info: lỗi của jwt

    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      if (info instanceof TokenExpiredError) {
        // 403 để làm mới token : hết hạn token
        throw new ForbiddenException(info.message); // info là lỗi, lỗi thì luon luon có message
      }
      if (info instanceof JsonWebTokenError) {
        // 401 để cho FE logout người dùng, vì token đang không hợp lệ
        throw new UnauthorizedException(info.message);
      }
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
