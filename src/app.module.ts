import { join } from 'path';
import { Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/auth.module';
import { PrismaModule } from '@core/prisma/prisma.module';
import { UserModule } from '@modules/user/user.module';
import { TermsModule } from '@modules/terms/terms.module';
import { ConfigModule } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ChatModule } from '@modules/chat/chat.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MailerModule.forRoot({
            transport: {
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT),
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD
                },
                tls: {}
            },
            defaults: {
                from: '"Fancy Chat App" <fancy@chat.com>'
            },
            template: {
                dir: join(__dirname, '../src/templates'),
                adapter: new HandlebarsAdapter(),
                options: {
                    strict: true
                }
            }
        }),
        AuthModule,
        PrismaModule,
        UserModule,
        TermsModule
    , ChatModule],
    controllers: []
})
export class AppModule {}
