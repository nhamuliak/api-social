import { Injectable } from '@nestjs/common';
import { RegistrationAuthDto } from './dto';
import { PrismaService } from '@core/prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(private readonly prismaService: PrismaService) {}

    registration(registrationAuthDto: RegistrationAuthDto) {
        return this.prismaService.user.create({
            data: Object.assign(registrationAuthDto)
        });
    }

    findAll() {
        return `This action returns all auth`;
    }

    findOne(id: number) {
        return `This action returns a #${id} auth`;
    }

    update(id: number, updateAuthDto: RegistrationAuthDto) {
        return `This action updates a #${id} auth`;
    }

    remove(id: number) {
        return `This action removes a #${id} auth`;
    }
}
