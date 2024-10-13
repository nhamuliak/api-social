import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
    constructor(private readonly mailerService: MailerService) {}

    public async sendResetPassword(to: string, name: string, token: string): Promise<void> {
        const resetLink = `http://localhost:4300/auth/reset-password?token=${token}`;

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
}
