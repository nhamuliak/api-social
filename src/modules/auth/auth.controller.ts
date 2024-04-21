import { Response } from 'express';
import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { TokenModel } from '@models/token.model';
import { AuthService } from './auth.service';
import { LoginAuthDto, RegistrationAuthDto } from './dto';

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

    @Post('logout')
    public async logout(@Res() res: Response): Promise<Response<string>> {
        await this.authService.logout();

        return res.status(HttpStatus.NO_CONTENT).send('Logged out.');
    }

    @Post('refresh')
    public async refresh(@Res() res: Response): Promise<Response<TokenModel>> {
        const tokens = await this.authService.refresh();

        return res.status(HttpStatus.OK).send(tokens);
    }
}
