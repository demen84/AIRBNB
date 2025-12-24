import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PORT } from './common/constant/app.constant';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Thêm api trong endpoint:
  app.setGlobalPrefix('api');

  //Dòng này tương đương app.listen() bên express
  await app.listen(PORT ?? 3000, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}
bootstrap();