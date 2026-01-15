import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VitriModule } from './modules-api/vitri/vitri.module';
import { NguoidungModule } from './modules-api/nguoidung/nguoidung.module';
import { PhongModule } from './modules-api/phong/phong.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modules-api/auth/auth.module';
import { PrismaModule } from './modules-system/prisma/prisma.module';
import { TokenModule } from './modules-system/token/token.module';
import { ProtectStrategy } from './common/guard/protect/protect.strategy';
import { CheckPermisionStrategy } from './common/guard/check-permission/check-permission.strategy';
import { DatphongModule } from './modules-api/datphong/datphong.module';
import { BinhluanModule } from './modules-api/binhluan/binhluan.module';
import { DashboardModule } from './modules-api/dashboard/dashboard.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
// import { MAIL_PASS, MAIL_USER } from './common/constant/app.constant';
import * as Joi from 'joi';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // !Cho phép dùng ConfigService ở mọi nơi mà không cần import lại
      // envFilePath: '.env', // Chỉ định file chứa biến môi trường
      validationSchema: Joi.object({
        MAIL_USER: Joi.string().email().required(),
        MAIL_PASS: Joi.string().required(),
        MAIL_HOST: Joi.string().default('smtp.gmail.com'),
        TOP_ROOM_BOOKED: Joi.number().default(5),
      }),
    }),
    AuthModule,
    DatphongModule,
    BinhluanModule,
    NguoidungModule,
    PrismaModule,
    TokenModule,
    VitriModule,
    PhongModule,
    DashboardModule,
    // 2. Sử dụng forRootAsync để cấu hình Mailer
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const mailUser = configService.get<string>('MAIL_USER');
        const mailPass = configService.get<string>('MAIL_PASS');
        const mailHost = configService.get<string>('MAIL_HOST');
        return {
          transport: {
            host: mailHost,
            port: 465,
            secure: true,
            auth: {
              user: mailUser,
              pass: mailPass,
            },
          },
          defaults: {
            from: `"Airbnb Support" <${mailUser}>`,
          },
          template: {
            // __dirname sẽ trỏ đúng vào thư mục dist khi chạy thực tế
            dir: join(__dirname, 'modules-system/mail/templates'),
            adapter: new HandlebarsAdapter(),
            options: { strict: true },
          },
        };
      },
      inject: [ConfigService], // Inject ConfigService vào factory function trên
    }),
  ],
  controllers: [AppController],

  // CheckPermisionStrategy là 1 @Injectable() & nó sd global nên ta bỏ nó vào provider của file app.module.ts là hợp lý.
  providers: [AppService, ProtectStrategy, CheckPermisionStrategy],
})
export class AppModule { }
