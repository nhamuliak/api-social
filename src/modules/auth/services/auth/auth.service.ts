import { BadRequestException, Injectable } from '@nestjs/common';
import { UserService } from '@modules/user/user.service';
import { compareProperties, hashProperty, getTokens, getAccessToken, verifyToken } from '@utils/helper';
import { TokenModel, UserModel, PayloadModel } from '@models/index';
import { LoginAuthDto, RegistrationAuthDto } from '../../dto';
import { TokenService } from '@modules/auth/services/token/token.service';
import { MailService } from '@modules/auth/services/mail/mail.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly tokenService: TokenService,
        private readonly mailService: MailService
    ) {}

    public async registration(registrationAuthDto: RegistrationAuthDto): Promise<void> {
        const user = await this.userService.getUserByEmail(registrationAuthDto.email);

        if (user) {
            throw new BadRequestException('The email has already existed.');
        }

        if (registrationAuthDto.acceptTerms === false) {
            throw new BadRequestException('You cannot register without accepted terms.');
        }

        // hash password
        registrationAuthDto.password = await hashProperty(registrationAuthDto.password);

        await this.userService.createUser(registrationAuthDto);
    }

    public async login(loginAuthDto: LoginAuthDto): Promise<{ tokens: TokenModel; user: PayloadModel }> {
        const user = await this.userService.getUserByEmail(loginAuthDto.email);

        if (!user) {
            throw new BadRequestException('You email or password is incorrect.');
        }

        const isMatch = await compareProperties(loginAuthDto.password, user.password);

        if (!isMatch) {
            throw new BadRequestException('You email or password is incorrect.');
        }

        const payload: PayloadModel = this.getPayload(user);
        const tokens: TokenModel = await getTokens(payload);
        const refreshTokenHash = await hashProperty(tokens.refreshToken);

        await this.tokenService.storeRefreshToken(user.id, refreshTokenHash);

        return { tokens, user: payload };
    }

    public async logout(userId: number): Promise<void> {
        await this.tokenService.deleteRefreshTokensByUserId(userId);
    }

    public async refresh(userId: number, refreshToken: string): Promise<TokenModel> {
        const user = await this.userService.getUserById(userId);

        if (!user) {
            throw new BadRequestException('Request denied.');
        }

        const hash = await this.tokenService.getTokenByUserId(userId);

        const isMatch = await compareProperties(refreshToken, hash);

        if (!isMatch) {
            throw new BadRequestException('Request denied.');
        }

        const payload: PayloadModel = this.getPayload(user);
        const tokens: TokenModel = await getTokens(payload);
        const refreshTokenHash = await hashProperty(tokens.refreshToken);

        await this.tokenService.storeRefreshToken(user.id, refreshTokenHash);

        return tokens;
    }

    public async recoverPassword(email: string): Promise<void> {
        const user = await this.userService.getUserByEmail(email);

        if (!user) {
            throw new BadRequestException('User not found.');
        }

        const payload: PayloadModel = this.getPayload(user);
        const token = await getAccessToken(payload);
        const name = `${user.firstName} ${user.lastName}`;

        await this.mailService.sendResetPassword(email, name, token);
    }

    public async resetPassword(token: string, password: string): Promise<void> {
        const payload = await verifyToken(token);
        const user = await this.userService.getUserById(payload.id);

        if (!user) {
            throw new BadRequestException('User not found.');
        }

        const hashedPassword = await hashProperty(password);

        await this.userService.updateUserById(user.id, { password: hashedPassword });
    }

    private getPayload(user: UserModel): PayloadModel {
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
