import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { UserService } from '@modules/user/user.service';
import { comparePasswords, hashPassword } from '@utils/helper';
import { LoginAuthDto, RegistrationAuthDto } from './dto';
import { TokenModel } from '@models/token.model';

@Injectable()
export class AuthService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly userService: UserService
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
        registrationAuthDto.password = await hashPassword(registrationAuthDto.password);

        await this.prismaService.user.create({
            data: Object.assign(registrationAuthDto)
        });
    }

    public async login(loginAuthDto: LoginAuthDto): Promise<TokenModel> {
        const user = await this.userService.getUserByEmail(loginAuthDto.email);

        if (!user) {
            throw new BadRequestException('You email or password is incorrect.');
        }

        const isMatch = await comparePasswords(loginAuthDto.password, user.password);

        if (!isMatch) {
            throw new BadRequestException('You email or password is incorrect.');
        }

        // const payload = { email: user.email, firstName: user.firstName };
        // const token = await this.jwtService.signAsync(payload);

        return {
            accessToken: '',
            refreshToken: ''
        };
    }

    public async logout(): Promise<void> {}

    public async refresh(): Promise<TokenModel> {
        return {
            accessToken: '',
            refreshToken: ''
        };
    }
}
