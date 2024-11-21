import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { UpdateUserDto } from '@modules/user/dto/update-user.dto';
import { PaginationModel, UserPrismaBody, UserPrismaModel } from '@business/models';
import { FullUserPrismaModel } from '@business/models/user-prisma.model';

@Injectable()
export class UserPrismaService {
    constructor(private readonly prismaService: PrismaService) {}

    public async getUsers(
        userId: number,
        firstName: string = '',
        lastName: string = '',
        page: number = 1,
        limit: number = 20
    ): Promise<PaginationModel<UserPrismaModel>> {
        const [count, records] = await this.prismaService.$transaction([
            this.prismaService.users.count(),
            this.prismaService.users.findMany({
                skip: page >= 0 ? (page - 1) * limit : 0,
                take: limit,
                where: {
                    id: {
                        not: userId
                    },
                    firstName: {
                        contains: firstName ?? '',
                        mode: 'insensitive'
                    },
                    lastName: {
                        contains: lastName ?? '',
                        mode: 'insensitive'
                    }
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    age: true,
                    avatar: true,
                    isOnline: true,
                    createdAt: true
                },
                orderBy: {
                    firstName: 'desc'
                }
            })
        ]);

        return { total: count, records: records };
    }

    public async getFullUserByEmailOrId(id: number, email: string = ''): Promise<FullUserPrismaModel> {
        return this.prismaService.users.findFirst({
            where: {
                OR: [{ id }, { email }]
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                age: true,
                avatar: true,
                password: true,
                acceptTerms: true,
                isOnline: true,
                createdAt: true
            }
        });
    }

    public async getUserByEmail(email: string): Promise<UserPrismaModel> {
        return this.prismaService.users.findUnique({
            where: {
                email
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                age: true,
                avatar: true,
                isOnline: true,
                createdAt: true
            }
        });
    }

    public async getUserById(id: number): Promise<UserPrismaModel> {
        return this.prismaService.users.findUnique({
            where: {
                id
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                age: true,
                avatar: true,
                isOnline: true,
                createdAt: true
            }
        });
    }

    public async createUser(body: UserPrismaBody): Promise<UserPrismaModel> {
        return this.prismaService.users.create({
            data: Object.assign(body),
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                age: true,
                avatar: true,
                isOnline: true,
                createdAt: true
            }
        });
    }

    public async updateUserById(id: number, data: UpdateUserDto): Promise<UserPrismaModel> {
        return this.prismaService.users.update({
            where: {
                id
            },
            data,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                age: true,
                avatar: true,
                isOnline: true,
                createdAt: true
            }
        });
    }

    public async updateUserOnlineStatusById(id: number, isOnline: boolean): Promise<UserPrismaModel> {
        return this.prismaService.users.update({
            where: {
                id
            },
            data: {
                isOnline
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                age: true,
                avatar: true,
                isOnline: true,
                createdAt: true
            }
        });
    }
}
