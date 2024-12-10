import { BadRequestException, Injectable } from '@nestjs/common';
import {
    compareProperties,
    hashProperty,
    getTokens,
    getAccessToken,
    verifyToken,
    verifyRefreshToken
} from '@utils/helper';
import { TokenModel, PayloadModel } from '@models/index';
import { LoginAuthDto, RegistrationAuthDto, SocialAuthDto } from '../../dto';
import { MailService } from '@modules/auth/services/mail/mail.service';
import { UserPrismaService } from '@business/services/user-prisma/user-prisma.service';
import { UserPrismaBody, UserPrismaModel } from '@business/models';
import { generate } from 'generate-password';

@Injectable()
export class AuthService {
    constructor(
        private readonly userPrismaService: UserPrismaService,
        private readonly mailService: MailService
    ) {}

    public async registration(registrationAuthDto: RegistrationAuthDto): Promise<void> {
        const user = await this.userPrismaService.getUserByEmail(registrationAuthDto.email);

        if (user) {
            throw new BadRequestException('The email has already existed.');
        }

        if (registrationAuthDto.acceptTerms === false) {
            throw new BadRequestException('You cannot register without accepted terms.');
        }

        // hash password
        registrationAuthDto.password = await hashProperty(registrationAuthDto.password);

        await this.userPrismaService.createUser(registrationAuthDto);
    }

    public async login(loginAuthDto: LoginAuthDto): Promise<{ tokens: TokenModel; user: PayloadModel }> {
        const user = await this.userPrismaService.getFullUserByEmailOrId(0, loginAuthDto.email);

        if (!user) {
            throw new BadRequestException('You email or password is incorrect.');
        }

        const isMatch = await compareProperties(loginAuthDto.password, user.password);

        if (!isMatch) {
            throw new BadRequestException('You email or password is incorrect.');
        }

        const payload: PayloadModel = this.getPayload(user);
        const tokens: TokenModel = await getTokens(payload);

        return {
            tokens,
            user: payload
        };
    }

    public async socialAuth(socialAuthDto: SocialAuthDto): Promise<{ tokens: TokenModel; user: PayloadModel }> {
        const user = await this.userPrismaService.getFullUserByEmailOrId(0, socialAuthDto.email);

        if (user) {
            const payload: PayloadModel = this.getPayload(user);
            const tokens: TokenModel = await getTokens(payload);

            return { tokens, user };
        }

        const generatedPassword = generate({ length: 10, numbers: true, strict: true });

        const hash = await hashProperty(generatedPassword);

        const body: UserPrismaBody = {
            email: socialAuthDto.email,
            firstName: socialAuthDto.firstName,
            lastName: socialAuthDto.lastName,
            avatar: socialAuthDto.avatar,
            password: hash,
            acceptTerms: true
        };

        const createdUser = await this.userPrismaService.createUser(body);

        const name = `${createdUser.firstName} ${createdUser.lastName}`;

        await this.mailService.sendGeneratedPassword(createdUser.email, name, generatedPassword);

        const payload: PayloadModel = this.getPayload(createdUser);
        const tokens: TokenModel = await getTokens(payload);

        return { tokens, user: payload };
    }

    public async refresh(refreshToken: string): Promise<TokenModel> {
        const payload = await verifyRefreshToken(refreshToken);
        const user = await this.userPrismaService.getUserById(payload.id);

        return await getTokens(user);
    }

    public async recoverPassword(email: string): Promise<void> {
        const user = await this.userPrismaService.getUserByEmail(email);

        if (!user) {
            throw new BadRequestException('User not found.');
        }

        const payload: PayloadModel = this.getPayload(user);
        const token = await getAccessToken(payload, '5m');
        const name = `${user.firstName} ${user.lastName}`;

        await this.mailService.sendResetPassword(email, name, token);
    }

    public async resetPassword(token: string, password: string): Promise<void> {
        const payload = await verifyToken(token);
        const user = await this.userPrismaService.getUserById(payload.id);

        if (!user) {
            throw new BadRequestException('User not found.');
        }

        const hashedPassword = await hashProperty(password);

        await this.userPrismaService.updateUserById(user.id, { password: hashedPassword });
    }

    private getPayload(user: UserPrismaModel): PayloadModel {
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isOnline: user.isOnline,
            age: user.age,
            avatar: user.avatar
        };
    }
}
