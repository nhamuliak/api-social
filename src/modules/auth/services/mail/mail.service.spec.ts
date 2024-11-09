import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MailerService } from '@nestjs-modules/mailer';

class MockMailerServiceMock {
    sendMail = jest.fn().mockResolvedValue(null);
}

describe('MailService', () => {
    let service: MailService;
    let mockMailerService: MailerService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MailService,
                {
                    provide: MailerService,
                    useClass: MockMailerServiceMock
                }
            ]
        }).compile();

        service = module.get<MailService>(MailService);
        mockMailerService = module.get<MailerService>(MailerService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('sendResetPassword', () => {
        it('should call sendMail with correct arguments', async () => {
            const to = 'user@example.com';
            const name = 'User';
            const token = 'testToken';
            const resetLink = `http://localhost:4300/auth/reset-password?token=${token}`;

            await service.sendResetPassword(to, name, token);

            expect(mockMailerService.sendMail).toHaveBeenCalledWith({
                to,
                subject: 'Reset Password',
                template: './reset-password',
                context: { name, resetLink }
            });
        });
    });

    describe('sendGeneratedPassword', () => {
        it('should call sendMail with correct arguments', async () => {
            const to = 'user@example.com';
            const name = 'User';
            const password = 'securePassword';

            await service.sendGeneratedPassword(to, name, password);

            expect(mockMailerService.sendMail).toHaveBeenCalledWith({
                to,
                subject: 'Chat App',
                template: './generated-password',
                context: { name, password }
            });
        });
    });
});
