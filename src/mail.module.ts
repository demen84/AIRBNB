import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';
import { join } from 'path';

@Module({
    imports: [
        MailerModule.forRoot({
            transport: {
                host: 'smtp.gmail.com',
                port: 465,
                secure: true, // dùng SSL
                auth: {
                    user: 'email_cua_ban@gmail.com',
                    pass: 'ma_16_ky_tu_vua_tao',
                },
            },
            defaults: {
                from: '"Airbnb Support" <email_cua_ban@gmail.com>',
            },
            template: {
                dir: join(__dirname, 'modules-system/mail/templates'),
                adapter: new HandlebarsAdapter(),
                options: {
                    strict: true,
                },
            },
        }),
    ],
})
export class AppModule { }