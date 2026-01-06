import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';

@Injectable()
export class RegisterThrottlerGuard extends ThrottlerGuard {
    // Ghi đè phương thức ném lỗi của thư viện
    protected throwThrottlingException(context: ExecutionContext): Promise<void> {
        throw new ThrottlerException(
            'Bạn đã đăng ký quá nhiều tài khoản. Vui lòng đợi 10 phút sau để tiếp tục.'
        );
    }
}