import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';

@Injectable()
export class OwnerUserGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();

        const userLogin = request.user; // từ JwtAuthGuard
        const id = Number(request.params.id);

        if (!userLogin || userLogin.id !== id) {
            throw new ForbiddenException(
                'Bạn chỉ có quyền upload avatar của chính mình',
            );
        }

        return true;
    }
}

// // src/common/guards/ownership.guard.ts
// import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';
// // import { AuthUser } from 'src/common/interface/auth-user.interface';
// import { OWNER_KEY } from '../../decorators/owner.decorator';

// @Injectable()
// export class OwnerGuard implements CanActivate {
//     constructor(private reflector: Reflector) { }

//     canActivate(context: ExecutionContext): boolean {
//         const request = context.switchToHttp().getRequest();
//         const user = request.user;

//         // 1️⃣ Nếu chưa login → không thể là owner
//         if (!user) {
//             throw new ForbiddenException('Chưa xác thực');
//         }

//         // 2️⃣ Lấy metadata từ @Owner()
//         const paramKey =
//             this.reflector.get<string>(OWNER_KEY, context.getHandler()) ??
//             this.reflector.get<string>(OWNER_KEY, context.getClass());

//         // 3️⃣ Nếu route KHÔNG gắn @Owner → bỏ qua
//         if (!paramKey) return true;

//         // 4️⃣ Lấy resource id từ params
//         const resourceId = Number(request.params[paramKey]);

//         if (!resourceId) {
//             throw new ForbiddenException('Không xác định được resource');
//         }

//         // 5️⃣ Check ownership
//         if (user.id !== resourceId) {
//             throw new ForbiddenException(
//                 'Bạn không có quyền thao tác trên resource này',
//             );
//         }

//         return true;
//     }
// }