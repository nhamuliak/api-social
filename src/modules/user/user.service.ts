import { Injectable } from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';
import { UpdateUserDto } from '@modules/user/dto/update-user.dto';
import { UserModel } from '@models/index';
import { RegistrationAuthDto } from '@modules/auth/dto';

@Injectable()
export class UserService {
    constructor(private prismaService: PrismaService) {}

    public async getUsers(
        firstName: string = '',
        lastName: string = '',
        page: number = 1,
        limit: number = 20
    ): Promise<any> {
        return this.prismaService.$transaction([
            this.prismaService.users.count(),
            this.prismaService.users.findMany({
                skip: page >= 0 ? (page - 1) * limit : 0,
                take: limit,
                where: {
                    firstName: {
                        contains: firstName ?? '',
                        mode: 'insensitive'
                    },
                    lastName: {
                        contains: lastName ?? '',
                        mode: 'insensitive'
                    }
                },
                orderBy: {
                    firstName: 'desc'
                }
            })
        ]);
    }

    public async getUserByEmail(email: string): Promise<UserModel> {
        return this.prismaService.users.findUnique({
            where: {
                email
            }
        });
    }

    public async getUserById(id: number): Promise<any> {
        return this.prismaService.users.findUnique({
            where: {
                id
            }
        });
    }

    public async createUser(registrationAuthDto: RegistrationAuthDto): Promise<UserModel> {
        return this.prismaService.users.create({
            data: Object.assign(registrationAuthDto)
        });
    }

    public async updateUserById(id: number, data: UpdateUserDto): Promise<any> {
        return this.prismaService.users.update({
            where: {
                id
            },
            data
        });
    }
}
