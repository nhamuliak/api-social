import { INestApplication, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AuthService } from '@modules/auth/services/auth/auth.service';
import { LoginAuthDto, RegistrationAuthDto, SocialAuthDto } from '@modules/auth/dto';
import { mockAuthLoginData, mockAuthRegistrationData, mockAuthSocialData, mockTokensData } from '@mock/data';
import * as cookieParser from 'cookie-parser';

describe('AuthController (e2e)', () => {
    let app: INestApplication;
    let authService: AuthService;
    const apiUrl = '/api/auth';

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule]
        })
            .overrideProvider(AuthService)
            .useValue({
                registration: jest.fn().mockResolvedValue(undefined),
                login: jest.fn().mockResolvedValue({
                    tokens: mockTokensData,
                    user: { id: 1, email: 'test@example.com' }
                }),
                socialAuth: jest.fn().mockResolvedValue({
                    tokens: mockTokensData,
                    user: { id: 1, email: 'social@example.com' }
                }),
                refresh: jest.fn().mockResolvedValue(mockTokensData),
                recoverPassword: jest.fn().mockResolvedValue(undefined),
                resetPassword: jest.fn().mockResolvedValue(undefined)
            })
            .compile();

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api');
        app.use(cookieParser(process.env.COOKIE_SECRET));
        app.use(cookieParser());
        await app.init();

        authService = moduleFixture.get<AuthService>(AuthService);
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /auth/registration', () => {
        it('should register a user successfully', async () => {
            const registrationAuthDto: RegistrationAuthDto = mockAuthRegistrationData;

            const response = await request(app.getHttpServer())
                .post(`${apiUrl}/registration`)
                .send(registrationAuthDto)
                .expect(HttpStatus.OK);

            expect(response.body.message).toBe('Your were successfully registered.');
            expect(authService.registration).toHaveBeenCalledWith(registrationAuthDto);
        });
    });

    describe('POST /auth/login', () => {
        it('should login a user successfully', async () => {
            const loginAuthDto: LoginAuthDto = mockAuthLoginData;

            const response = await request(app.getHttpServer())
                .post(`${apiUrl}/login`)
                .send(loginAuthDto)
                .expect(HttpStatus.OK);

            expect(authService.login).toHaveBeenCalledWith(loginAuthDto);
            expect(response.body.accessToken).toBe(mockTokensData.accessToken);
            expect(response.body.user).toEqual({ id: 1, email: 'test@example.com' });
        });
    });

    describe('POST /auth/social-auth', () => {
        it('should authenticate user through social login', async () => {
            const socialAuthDto: SocialAuthDto = mockAuthSocialData;

            const response = await request(app.getHttpServer())
                .post(`${apiUrl}/social-auth`)
                .send(socialAuthDto)
                .expect(HttpStatus.OK);

            expect(response.body.accessToken).toBe(mockTokensData.accessToken);
            expect(response.body.user).toEqual({ id: 1, email: 'social@example.com' });
            expect(authService.socialAuth).toHaveBeenCalledWith(socialAuthDto);
        });
    });

    describe('POST /auth/logout', () => {
        it('should logout a user successfully', async () => {
            const response = await request(app.getHttpServer()).post(`${apiUrl}/logout`).expect(HttpStatus.OK);

            expect(response.body).toEqual({});
        });
    });

    describe('POST /auth/refresh', () => {
        it('should refresh the access token successfully', async () => {
            const response = await request(app.getHttpServer())
                .post(`${apiUrl}/refresh`)
                .set('Cookie', 'refreshToken=refresh_token_mock')
                .expect(HttpStatus.OK);

            expect(response.body.accessToken).toBe(mockTokensData.accessToken);
            expect(authService.refresh).toHaveBeenCalledWith('refresh_token_mock');
        });
    });

    describe('POST /auth/recover-password', () => {
        it('should recover the password successfully', async () => {
            const response = await request(app.getHttpServer())
                .post(`${apiUrl}/recover-password`)
                .send({ email: 'test@example.com' })
                .expect(HttpStatus.OK);

            expect(response.body.message).toBe('Please check your email.');
            expect(authService.recoverPassword).toHaveBeenCalledWith('test@example.com');
        });
    });

    describe('POST /auth/reset-password', () => {
        it('should reset the password successfully', async () => {
            const response = await request(app.getHttpServer())
                .post(`${apiUrl}/reset-password`)
                .send({ token: 'reset_token', password: 'newpassword123' })
                .expect(HttpStatus.OK);

            expect(response.body.message).toBe('Your password was updated successfully.');
            expect(authService.resetPassword).toHaveBeenCalledWith('reset_token', 'newpassword123');
        });
    });
});
