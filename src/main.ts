import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { PORT } from './common/constant/app.constant';
import { ValidationPipe } from '@nestjs/common';
import { ProtectGuard } from './common/guard/protect/protect.guard';
import { CheckPermissionGuard } from './common/guard/check-permission/check-permission.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptors';
import { ResponseSuccessInterceptor } from './common/interceptors/response-success.interceptors';
import { initSwagger } from './common/swagger/init.swagger';
// 1. import
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  // const app = await NestFactory.create(AppModule);

  // 2. Ép kiểu NestExpressApplication
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const reflector = app.get(Reflector);

  app.useGlobalGuards(new ProtectGuard(reflector));
  app.useGlobalGuards(new CheckPermissionGuard(reflector));

  app.useGlobalPipes(
    new ValidationPipe({
      // Nếu ko có 2 dòng code sau thì khi gọi api bên postman sẽ báo như sau:
      // "page must not be less than 1",
      // "page must be a number conforming to the specified constraints",
      // bật chức năng chuyển kiểu data
      transform: true,
      // tự suy ra kiểu data của biến
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Gắn interceptor ở Global:
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalInterceptors(new ResponseSuccessInterceptor(reflector));

  // 3. Cấu hình Static Assets (Đặt trước listen)
  // Giả sử ảnh bạn lưu ở thư mục gốc /uploads
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/public/',
  });

  // Thêm api trong endpoint:
  app.setGlobalPrefix('api');

  // Gắn Swagger: http://localhost:3839/docs
  initSwagger(app);

  // main.ts
  // console.log("Database URL check:", process.env.DATABASE_URL);

  //Dòng này tương đương app.listen() bên express
  await app.listen(PORT ?? 3000, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}
bootstrap();
