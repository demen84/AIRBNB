import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { KEY_MESSAGE_RESPONSE } from '../decorators/response-message.decorator';

@Injectable()
export class ResponseSuccessInterceptor implements NestInterceptor {
  constructor(public reflector: Reflector) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const res = context.switchToHttp().getResponse();

    // const message = this.reflector.getAllAndOverride(KEY_MESSAGE_RESPONSE, [
    //   context.getHandler(),
    //   context.getClass(),
    // ]);

    return next.handle().pipe(
      map((data) => {
        // console.log({ data });
        return {
          status: 'Success',
          statusCode: res.statusCode,
          message: data.thongBao || "OK",
          data,
          docs: 'example api',
        };
      }),
    );
  }
}
