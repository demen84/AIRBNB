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
// import { AuthUser } from 'src/common/interface/auth-user.interface';

// @Injectable()
// export class OwnershipGuard implements CanActivate {
//     constructor(private readonly reflector: Reflector) { }

//     canActivate(context: ExecutionContext): boolean {
//         const request = context.switchToHttp().getRequest();
//         const user: AuthUser = request.user; // từ JWT strategy

//         const paramId = +request.params.id; // lấy từ :id

//         if (!user || user.id !== paramId) {
//             throw new ForbiddenException('Bạn chỉ có quyền upload avatar của chính mình');
//         }

//         return true;
//     }
// }