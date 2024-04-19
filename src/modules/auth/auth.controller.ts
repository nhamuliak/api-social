import * as bcrypt from 'bcrypt';
import { Controller, Post, Body, BadRequestException, Res, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto, RegistrationAuthDto } from './dto';
import { UserService } from '@modules/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly userService: UserService,
        private readonly jwtService: JwtService
    ) {}

    @Post('registration')
    async registration(@Res() res: Response, @Body() registrationAuthDto: RegistrationAuthDto) {
        const user = await this.userService.getUserByEmail(registrationAuthDto.email);

        if (user) {
            throw new BadRequestException('The email has already existed.');
        }

        if (registrationAuthDto.acceptTerms === false) {
            throw new BadRequestException('You cannot register without accepted terms.');
        }

        // hash password
        const hash = await bcrypt.hash(registrationAuthDto.password, 10);

        const body = {
            ...registrationAuthDto,
            password: hash
        };

        await this.authService.registration(body);

        return res.status(HttpStatus.CREATED).send('Your registration is successful.');
    }

    @Post('login')
    async login(@Res() res: Response, @Body() loginAuthDto: LoginAuthDto) {
        const user = await this.userService.getUserByEmail(loginAuthDto.email);

        if (!user) {
            throw new BadRequestException('You email or password is incorrect.');
        }

        const isMatch = await bcrypt.compare(loginAuthDto.password, user.password);

        if (!isMatch) {
            throw new BadRequestException('You email or password is incorrect.');
        }

        const payload = { email: user.email, firstName: user.firstName };

        const token = await this.jwtService.signAsync(payload);

        res.cookie('token', token);

        return res.status(HttpStatus.OK).send(token);
    }

    @Post('logout')
    logout(@Res() res: Response) {
        res.clearCookie('token');

        return res.status(HttpStatus.NO_CONTENT).send('Logged out.');
    }
}
