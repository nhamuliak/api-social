import { Response } from 'express';
import { Controller, Post, Body, Res, HttpStatus, UseGuards } from '@nestjs/common';
import { TokenModel } from '@models/token.model';
import { AuthService } from './services/auth/auth.service';
import { LoginAuthDto, RegistrationAuthDto } from './dto';
import { User } from '@core/decorators';
import { AccessGuard } from '@core/guards/access/access.guard';
import { RefreshGuard } from '@core/guards/refresh/refresh.guard';

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

    @UseGuards(AccessGuard)
    @Post('logout')
    public async logout(@User('id') userId: number, @Res() res: Response): Promise<Response<string>> {
        await this.authService.logout(userId);

        return res.status(HttpStatus.OK).send('Logged out.');
    }

    @UseGuards(RefreshGuard)
    @Post('refresh')
    public async refresh(
        @User() body: { userId: number; refreshToken: string },
        @Res() res: Response
    ): Promise<Response<TokenModel>> {
        const tokens = await this.authService.refresh(body.userId, body.refreshToken);

        return res.status(HttpStatus.OK).send(tokens);
    }
}
