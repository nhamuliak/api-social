import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import * as process from 'node:process';

@Injectable()
export class MailService {
    constructor(private readonly mailerService: MailerService) {}

    public async sendResetPassword(to: string, name: string, token: string): Promise<void> {
        const resetLink = `${process.env.FRONTEND_LINK_URL}/auth/reset-password?token=${token}`;

        await this.mailerService.sendMail({
            to,
            subject: 'Reset Password',
            template: './reset-password',
            context: {
                name,
                resetLink
            }
        });
    }

    public async sendGeneratedPassword(to: string, name: string, password: string): Promise<void> {
        await this.mailerService.sendMail({
            to,
            subject: 'Chat App',
            template: './generated-password',
            context: {
                name,
                password
            }
        });
    }
}
