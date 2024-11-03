import { Response } from 'express';
import { Controller, Post, Body, Res, HttpStatus, Req } from '@nestjs/common';
import { AuthService } from './services/auth/auth.service';
import { LoginAuthDto, RegistrationAuthDto, SocialAuthDto } from './dto';
import { Cookies } from '@core/decorators';
import { AuthResponse } from '@models/auth.model';
import { ENV_PRODUCTION } from '@utils/constants';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('registration')
    public async registration(
        @Res() res: Response,
        @Body() registrationAuthDto: RegistrationAuthDto
    ): Promise<Response<string>> {
        await this.authService.registration(registrationAuthDto);

        return res.status(HttpStatus.OK).send({ message: 'Your were successfully registered.' });
    }

    @Post('login')
    public async login(
        @Res() res: Response,
        @Req() req: any,
        @Body() loginAuthDto: LoginAuthDto
    ): Promise<Response<AuthResponse>> {
        const result = await this.authService.login(loginAuthDto);

        res.cookie('refreshToken', result.tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === ENV_PRODUCTION
        });

        return res.status(HttpStatus.OK).send({
            accessToken: result.tokens.accessToken,
            user: result.user
        });
    }

    @Post('social-auth')
    public async socialAuth(
        @Res() res: Response,
        @Body() socialAuthDto: SocialAuthDto
    ): Promise<Response<AuthResponse>> {
        const result = await this.authService.socialAuth(socialAuthDto);

        res.cookie('refreshToken', result.tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === ENV_PRODUCTION
        });

        return res.status(HttpStatus.OK).send({
            accessToken: result.tokens.accessToken,
            user: result.user
        });
    }

    @Post('logout')
    public async logout(@Res() res: Response): Promise<Response<string>> {
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === ENV_PRODUCTION
        });

        return res.status(HttpStatus.OK).send();
    }

    @Post('refresh')
    public async refresh(
        @Cookies('refreshToken') refreshToken: string,
        @Res() res: Response
    ): Promise<Response<{ accessToken: string }>> {
        const tokens = await this.authService.refresh(refreshToken);

        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === ENV_PRODUCTION
        });

        return res.status(HttpStatus.OK).send({ accessToken: tokens.accessToken });
    }

    @Post('recover-password')
    public async recoverPassword(@Body('email') email: string, @Res() res: Response): Promise<Response<string>> {
        await this.authService.recoverPassword(email);

        return res.status(HttpStatus.OK).send({ message: 'Please check your email.' });
    }

    @Post('reset-password')
    public async resetPassword(
        @Body() { token, password }: { token: string; password: string },
        @Res() res: Response
    ): Promise<Response<string>> {
        await this.authService.resetPassword(token, password);

        return res.status(HttpStatus.OK).send({ message: 'Your password was updated successfully.' });
    }
}
