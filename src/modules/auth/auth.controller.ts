import { Response } from 'express';
import { Controller, Post, Body, Res, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenModel } from '@models/token.model';
import { AuthService } from './services/auth/auth.service';
import { LoginAuthDto, RegistrationAuthDto } from './dto';
import { ACCESS_STRATEGY_NAME } from '@utils/constants';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('registration')
    public async registration(
        @Res() res: Response,
        @Body() registrationAuthDto: RegistrationAuthDto
    ): Promise<Response<string>> {
        await this.authService.registration(registrationAuthDto);

        return res.status(HttpStatus.OK).send('Your registration is successful.');
    }

    @Post('login')
    public async login(@Res() res: Response, @Body() loginAuthDto: LoginAuthDto): Promise<Response<TokenModel>> {
        const tokens = await this.authService.login(loginAuthDto);

        return res.status(HttpStatus.OK).send(tokens);
    }

    @UseGuards(AuthGuard(ACCESS_STRATEGY_NAME))
    @Post('logout')
    public async logout(@Body() body: { userId: number }, @Res() res: Response): Promise<Response<string>> {
        await this.authService.logout(body.userId);

        return res.status(HttpStatus.OK).send('Logged out.');
    }

    @Post('refresh')
    public async refresh(
        @Body() body: { userId: number; refreshToken: string },
        @Res() res: Response
    ): Promise<Response<TokenModel>> {
        const tokens = await this.authService.refresh(body.userId, body.refreshToken);

        return res.status(HttpStatus.OK).send(tokens);
    }
}
