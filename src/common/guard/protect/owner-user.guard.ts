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