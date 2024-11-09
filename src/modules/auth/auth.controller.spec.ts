import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth/auth.service';
import { MockAuthService } from '@mock/services';
import { HttpStatus } from '@nestjs/common';
import { ENV_PRODUCTION } from '@utils/constants';
import { LoginAuthDto, RegistrationAuthDto, SocialAuthDto } from '@modules/auth/dto';
import { mockTokensData, mockUserData } from '@mock/data';
import { mockResponse } from '@mock/helper';

describe('AuthController', () => {
    let controller: AuthController;
    let mockAuthService: AuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useClass: MockAuthService
                }
            ]
        }).compile();

        controller = module.get<AuthController>(AuthController);
        mockAuthService = module.get<AuthService>(AuthService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('registration', () => {
        it('should register a user and send success message', async () => {
            const res = mockResponse();
            const dto = new RegistrationAuthDto();

            await controller.registration(res, dto);

            expect(mockAuthService.registration).toHaveBeenCalledWith(dto);
            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(res.send).toHaveBeenCalledWith({ message: 'Your were successfully registered.' });
        });
    });

    describe('login', () => {
        it('should log in a user and set cookies', async () => {
            const res = mockResponse();
            const dto = new LoginAuthDto();
            const tokens = mockTokensData;
            const user = mockUserData;

            jest.spyOn(mockAuthService, 'login').mockResolvedValue({ tokens, user });

            await controller.login(res, null, dto);

            expect(mockAuthService.login).toHaveBeenCalledWith(dto);
            expect(res.cookie).toHaveBeenCalledWith('refreshToken', tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === ENV_PRODUCTION
            });
            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(res.send).toHaveBeenCalledWith({ accessToken: tokens.accessToken, user });
        });
    });

    describe('socialAuth', () => {
        it('should log in a user via social auth and set cookies', async () => {
            const res = mockResponse();
            const dto = new SocialAuthDto();
            const tokens = mockTokensData;
            const user = mockUserData;

            jest.spyOn(mockAuthService, 'socialAuth').mockResolvedValue({ tokens, user });

            await controller.socialAuth(res, dto);

            expect(mockAuthService.socialAuth).toHaveBeenCalledWith(dto);
            expect(res.cookie).toHaveBeenCalledWith('refreshToken', tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === ENV_PRODUCTION
            });
            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(res.send).toHaveBeenCalledWith({ accessToken: tokens.accessToken, user });
        });
    });

    describe('logout', () => {
        it('should clear refreshToken cookie and send success response', async () => {
            const res = mockResponse();

            await controller.logout(res);

            expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === ENV_PRODUCTION
            });
            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(res.send).toHaveBeenCalled();
        });
    });

    describe('refresh', () => {
        it('should refresh tokens and set new refreshToken cookie', async () => {
            const res = mockResponse();
            const refreshToken = 'old-refresh-token';
            const newTokens = { accessToken: 'new-access-token', refreshToken: 'new-refresh-token' };

            jest.spyOn(mockAuthService, 'refresh').mockResolvedValue(newTokens);

            await controller.refresh(refreshToken, res);

            expect(mockAuthService.refresh).toHaveBeenCalledWith(refreshToken);
            expect(res.cookie).toHaveBeenCalledWith('refreshToken', newTokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === ENV_PRODUCTION
            });
            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(res.send).toHaveBeenCalledWith({ accessToken: newTokens.accessToken });
        });
    });

    describe('recoverPassword', () => {
        it('should initiate password recovery and send success message', async () => {
            const res = mockResponse();
            const email = 'user@example.com';

            await controller.recoverPassword(email, res);

            expect(mockAuthService.recoverPassword).toHaveBeenCalledWith(email);
            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(res.send).toHaveBeenCalledWith({ message: 'Please check your email.' });
        });
    });

    describe('resetPassword', () => {
        it('should reset password and send success message', async () => {
            const res = mockResponse();
            const token = 'reset-token';
            const password = 'new-password';

            await controller.resetPassword({ token, password }, res);

            expect(mockAuthService.resetPassword).toHaveBeenCalledWith(token, password);
            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(res.send).toHaveBeenCalledWith({ message: 'Your password was updated successfully.' });
        });
    });
});
