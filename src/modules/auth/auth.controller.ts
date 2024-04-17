import bcrypt from 'bcrypt';
import { Controller, Get, Post, Body, Patch, Param, Delete, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto, RegistrationAuthDto } from './dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('registration')
    async registration(@Body() registrationAuthDto: RegistrationAuthDto) {
        const user = null; // TODO:: get user by email

        if (user) {
            throw new BadRequestException('The email has already existed.');
        }

        // hash password
        const hash = await bcrypt.hash(registrationAuthDto.password, 10);

        const body = {
            ...registrationAuthDto,
            password: hash
        };
        console.log('body: ', body);
        // TODO:: create a new user

        return registrationAuthDto;
    }

    @Post('login')
    login(@Body() loginAuthDto: LoginAuthDto) {
        return loginAuthDto;
    }

    @Post('logout')
    logout(@Body() token: { token: string }) {
        return 'logout' + token;
    }

    @Post()
    create(@Body() createAuthDto: RegistrationAuthDto) {
        return this.authService.create(createAuthDto);
    }

    @Get()
    findAll() {
        return this.authService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.authService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateAuthDto: RegistrationAuthDto) {
        return this.authService.update(+id, updateAuthDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.authService.remove(+id);
    }
}
