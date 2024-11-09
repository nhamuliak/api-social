import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { LoginAuthDto, RegistrationAuthDto, SocialAuthDto } from '@modules/auth/dto';
import { BadRequestException } from '@nestjs/common';
import { FullUserModel } from '@models/user.model';
import { TokenModel } from '@models/token.model';
import {
    compareProperties,
    getAccessToken,
    getTokens,
    hashProperty,
    verifyRefreshToken,
    verifyToken
} from '@utils/helper';
import { MockMailService } from '@mock/services';
import { MockUserPrismaService } from '@mock/prisma-service';
import { UserPrismaService } from '@business/services/user-prisma/user-prisma.service';
import { MailService } from '@modules/auth/services/mail/mail.service';
import {
    mockAuthLoginData,
    mockAuthRegistrationData,
    mockAuthSocialData,
    mockFullUserData,
    mockTokensData,
    mockUserData
} from '@mock/data';

jest.mock('@utils/helper');

describe('AuthService', () => {
    let service: AuthService;
    let mockUserPrismaService: MockUserPrismaService;
    let mockMailService: MockMailService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: UserPrismaService,
                    useClass: MockUserPrismaService
                },
                {
                    provide: MailService,
                    useClass: MockMailService
                }
            ]
        }).compile();

        service = module.get<AuthService>(AuthService);
        mockUserPrismaService = module.get<UserPrismaService>(UserPrismaService) as any;
        mockMailService = module.get<MailService>(MailService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('registration', () => {
        it('should register a new user successfully', async () => {
            const dto: RegistrationAuthDto = mockAuthRegistrationData;

            mockUserPrismaService.getUserByEmail.mockResolvedValue(null);
            (hashProperty as jest.Mock).mockResolvedValue(dto.password);
            mockUserPrismaService.createUser.mockResolvedValue({} as any);

            await expect(service.registration(dto)).resolves.not.toThrow();
            expect(mockUserPrismaService.getUserByEmail).toHaveBeenCalledWith(dto.email);
            expect(hashProperty).toHaveBeenCalledWith(dto.password);
            expect(mockUserPrismaService.createUser).toHaveBeenCalled();
        });

        it('should throw an error if the email already exists', async () => {
            const dto: RegistrationAuthDto = mockAuthRegistrationData;

            mockUserPrismaService.getUserByEmail.mockResolvedValue({} as any);

            await expect(service.registration(dto)).rejects.toThrow(BadRequestException);
        });

        it('should throw an error if terms are not accepted', async () => {
            const dto: RegistrationAuthDto = { ...mockAuthRegistrationData, acceptTerms: false };

            await expect(service.registration(dto)).rejects.toThrow(BadRequestException);
        });
    });

    describe('login', () => {
        it('should login user and return tokens and user data', async () => {
            const dto: LoginAuthDto = mockAuthLoginData;
            const user: FullUserModel = mockFullUserData;
            const tokens: TokenModel = mockTokensData;

            mockUserPrismaService.getFullUserByEmailOrId.mockResolvedValue(user);
            (compareProperties as jest.Mock).mockResolvedValue(true);
            (getTokens as jest.Mock).mockResolvedValue(tokens);

            const result = await service.login(dto);

            expect(result).toEqual({ tokens, user });
            expect(mockUserPrismaService.getFullUserByEmailOrId).toHaveBeenCalledWith(0, dto.email);
            expect(compareProperties).toHaveBeenCalledWith(dto.password, user.password);
            expect(getTokens).toHaveBeenCalled();
        });

        it('should throw an error if credentials are incorrect', async () => {
            const dto: LoginAuthDto = mockAuthLoginData;

            // mockUserPrismaService.getFullUserByEmailOrId.mockResolvedValue(new Promise());

            await expect(service.login(dto)).rejects.toThrow(BadRequestException);
        });
    });

    describe('socialAuth', () => {
        it('should login existing social user', async () => {
            const dto: SocialAuthDto = mockAuthSocialData;
            const user = mockUserData;
            const tokens = mockTokensData;

            mockUserPrismaService.getFullUserByEmailOrId.mockResolvedValue(user);
            (getTokens as jest.Mock).mockResolvedValue(tokens);

            const result = await service.socialAuth(dto);

            expect(result).toEqual({ tokens, user });
            expect(mockUserPrismaService.getFullUserByEmailOrId).toHaveBeenCalledWith(0, dto.email);
            expect(getTokens).toHaveBeenCalledWith(expect.any(Object));
        });

        it('should create new social user and send email with generated password', async () => {
            const dto: SocialAuthDto = mockAuthSocialData;
            const user = mockUserData;
            const tokens = mockTokensData;

            jest.spyOn(mockUserPrismaService, 'getFullUserByEmailOrId').mockImplementation(() => Promise.resolve(null));
            jest.spyOn(mockUserPrismaService, 'createUser').mockImplementation(() => Promise.resolve(user));
            jest.spyOn(mockMailService, 'sendGeneratedPassword').mockImplementation(() => Promise.resolve(null));

            (hashProperty as jest.Mock).mockResolvedValue('hashed_password');
            (getTokens as jest.Mock).mockResolvedValue(tokens);

            const result = await service.socialAuth(dto);

            expect(result).toEqual({ tokens, user });
            expect(mockUserPrismaService.createUser).toHaveBeenCalled();
            expect(mockMailService.sendGeneratedPassword).toHaveBeenCalledWith(
                user.email,
                `${user.firstName} ${user.lastName}`,
                expect.any(String)
            );
        });
    });

    describe('refresh', () => {
        it('should return new tokens when refresh token is valid', async () => {
            const mockRefreshToken = 'valid-refresh-token';
            const mockPayload = { id: 1 };
            const mockUser = mockUserData;
            const mockTokens = mockTokensData;

            (verifyRefreshToken as jest.Mock).mockResolvedValue(mockPayload);
            (getTokens as jest.Mock).mockResolvedValue(mockTokens);

            jest.spyOn(mockUserPrismaService, 'getUserById').mockResolvedValue(mockUser);

            const result = await service.refresh(mockRefreshToken);

            expect(verifyRefreshToken).toHaveBeenCalledWith(mockRefreshToken);
            expect(mockUserPrismaService.getUserById).toHaveBeenCalledWith(mockPayload.id);
            expect(getTokens).toHaveBeenCalledWith(mockUser);
            expect(result).toEqual(mockTokens);
        });
    });

    describe('recoverPassword', () => {
        it('should send password recovery email if user exists', async () => {
            const email = 'test@test.com';
            const mockUser = mockUserData;
            const mockToken = 'recovery-token';
            const mockPayload = { id: 1 };

            service['getPayload'] = jest.fn().mockResolvedValue(mockPayload);
            (getAccessToken as jest.Mock).mockResolvedValue(mockToken);

            jest.spyOn(mockUserPrismaService, 'getUserByEmail').mockResolvedValue(mockUser);
            jest.spyOn(mockMailService, 'sendResetPassword').mockImplementation(() => Promise.resolve(null));

            await service.recoverPassword(email);

            expect(mockUserPrismaService.getUserByEmail).toHaveBeenCalledWith(email);
            expect(mockMailService.sendResetPassword).toHaveBeenCalledWith(email, 'Jack Doe', mockToken);
        });

        it('should throw BadRequestException if user does not exist', async () => {
            const email = 'nonexistent@test.com';
            jest.spyOn(mockUserPrismaService, 'getUserByEmail').mockResolvedValue(null);

            await expect(service.recoverPassword(email)).rejects.toThrowError(BadRequestException);
        });
    });

    describe('resetPassword', () => {
        it('should reset the password if token is valid', async () => {
            const mockToken = 'valid-reset-token';
            const mockPassword = 'new-password';
            const mockPayload = { id: 1 };
            const mockUser = mockUserData;
            const hashedPassword = 'hashed-new-password';

            (verifyToken as jest.Mock).mockResolvedValue(mockPayload);
            (hashProperty as jest.Mock).mockResolvedValue(hashedPassword);

            jest.spyOn(mockUserPrismaService, 'getUserById').mockResolvedValue(mockUser);
            jest.spyOn(mockUserPrismaService, 'updateUserById').mockResolvedValue(mockUser);

            await service.resetPassword(mockToken, mockPassword);

            expect(verifyToken).toHaveBeenCalledWith(mockToken);
            expect(mockUserPrismaService.getUserById).toHaveBeenCalledWith(mockPayload.id);
            expect(hashProperty).toHaveBeenCalledWith(mockPassword);
            expect(mockUserPrismaService.updateUserById).toHaveBeenCalledWith(mockUser.id, {
                password: hashedPassword
            });
        });

        it('should throw BadRequestException if user does not exist', async () => {
            const mockToken = 'valid-reset-token';
            const mockPassword = 'new-password';
            const mockPayload = { id: 1 };

            (verifyToken as jest.Mock).mockResolvedValue(mockPayload);
            jest.spyOn(mockUserPrismaService, 'getUserById').mockResolvedValue(null);

            await expect(service.resetPassword(mockToken, mockPassword)).rejects.toThrowError(BadRequestException);
        });
    });
});
