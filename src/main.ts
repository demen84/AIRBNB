import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PORT } from './common/constant/app.constant';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  // Thêm api trong endpoint:
  app.setGlobalPrefix('api');

  //Dòng này tương đương app.listen() bên express
  await app.listen(PORT ?? 3000, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}
bootstrap();
