import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const initSwagger = (app: INestApplication<any>) => {
  const config = new DocumentBuilder()
    .setTitle('AIR BNB')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('Air_Bnb Api Document')
    .addBearerAuth() //biểu tượng ổ khóa Authorize
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory, {
    // Xử lý lưu token, F5 thì ko bị mất token
    swaggerOptions: {
      persistAuthorization: true, //lưu lại token cho FE nhàn hơn, khi F5 thì token ko bị mất
    },
  });
};
