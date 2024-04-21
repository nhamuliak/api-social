import { BadRequestException, Injectable } from '@nestjs/common';
import { UserService } from '@modules/user/user.service';
import { compareProperties, hashProperty, getTokens } from '@utils/helper';
import { TokenModel, UserModel, PayloadModel } from '@models/index';
import { LoginAuthDto, RegistrationAuthDto } from '../../dto';
import { TokenService } from '@modules/auth/services/token/token.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly tokenService: TokenService
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

    public async login(loginAuthDto: LoginAuthDto): Promise<TokenModel> {
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

        return tokens;
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

    private getPayload(user: UserModel): PayloadModel {
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isOnline: user.isOnline
        };
    }
}
