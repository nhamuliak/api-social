import { Test, TestingModule } from '@nestjs/testing';
import { UserPrismaService } from './user-prisma.service';
import { PrismaService } from '@business/prisma.service';
import { MockBasicPrismaService } from '@mock/prisma-service';
import { UpdateUserDto } from '@modules/user/dto/update-user.dto';
import { BadRequestException } from '@nestjs/common';
import { mockCreateUserData, mockFullUserData, mockUserData } from '@mock/data';

describe('UserPrismaService', () => {
    let service: UserPrismaService;
    let mockPrismaService: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserPrismaService,
                {
                    provide: PrismaService,
                    useClass: MockBasicPrismaService
                }
            ]
        }).compile();

        service = module.get<UserPrismaService>(UserPrismaService);
        mockPrismaService = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getUsers', () => {
        it('should return users with pagination', async () => {
            const userId = 1;
            const mockUsers = [mockUserData];

            jest.spyOn(mockPrismaService, '$transaction').mockResolvedValue([10, mockUsers]);

            const result = await service.getUsers(userId);

            expect(result).toEqual({ total: 10, records: mockUsers });
            expect(mockPrismaService.$transaction).toHaveBeenCalledWith([
                mockPrismaService.users.count(),
                mockPrismaService.users.findMany({
                    skip: 0,
                    take: 20,
                    where: {
                        id: { not: userId },
                        firstName: { contains: '', mode: 'insensitive' },
                        lastName: { contains: '', mode: 'insensitive' }
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
                    orderBy: { firstName: 'desc' }
                })
            ]);
        });
    });

    describe('getUserByEmail', () => {
        it('should return a user by email', async () => {
            const email = 'test@example.com';
            const mockUser = mockFullUserData;

            jest.spyOn(mockPrismaService.users, 'findUnique').mockResolvedValue(mockUser);

            const result = await service.getUserByEmail(email);

            expect(result).toEqual(mockUser);
            expect(mockPrismaService.users.findUnique).toHaveBeenCalledWith({
                where: { email },
                select: expect.objectContaining({
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    age: true,
                    avatar: true,
                    isOnline: true,
                    createdAt: true
                })
            });
        });
    });

    describe('createUser', () => {
        it('should create a new user and return it', async () => {
            const createUserDto = mockCreateUserData;
            const mockUser = mockFullUserData;

            jest.spyOn(mockPrismaService.users, 'create').mockResolvedValue(mockUser);

            const result = await service.createUser(createUserDto);

            expect(result).toEqual(mockUser);
            expect(mockPrismaService.users.create).toHaveBeenCalledWith({
                data: createUserDto,
                select: expect.objectContaining({
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    age: true,
                    avatar: true,
                    isOnline: true,
                    createdAt: true
                })
            });
        });
    });

    describe('updateUserById', () => {
        it('should update user details and return the updated user', async () => {
            const id = 1;
            const updateUserDto: UpdateUserDto = { firstName: 'Updated' };
            const mockUpdatedUser = { ...mockFullUserData, ...updateUserDto };

            jest.spyOn(mockPrismaService.users, 'update').mockResolvedValue(mockUpdatedUser);

            const result = await service.updateUserById(id, updateUserDto);

            expect(result).toEqual(mockUpdatedUser);
            expect(mockPrismaService.users.update).toHaveBeenCalledWith({
                where: { id },
                data: updateUserDto,
                select: expect.objectContaining({
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    age: true,
                    avatar: true,
                    isOnline: true,
                    createdAt: true
                })
            });
        });

        it('should throw an error if user not found', async () => {
            const id = 1;
            const updateUserDto: UpdateUserDto = { firstName: 'Updated' };

            jest.spyOn(mockPrismaService.users, 'update').mockRejectedValue(new BadRequestException('User not found'));

            await expect(service.updateUserById(id, updateUserDto)).rejects.toThrow(BadRequestException);
        });
    });

    describe('updateUserOnlineStatusById', () => {
        it('should update the user online status', async () => {
            const id = 1;
            const isOnline = true;
            const mockUpdatedUser = {
                ...mockFullUserData,
                id,
                email: 'test@example.com',
                firstName: 'John',
                lastName: 'Doe',
                isOnline
            };

            jest.spyOn(mockPrismaService.users, 'update').mockResolvedValue(mockUpdatedUser);

            const result = await service.updateUserOnlineStatusById(id, isOnline);

            expect(result).toEqual(mockUpdatedUser);
            expect(mockPrismaService.users.update).toHaveBeenCalledWith({
                where: { id },
                data: { isOnline },
                select: expect.objectContaining({
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    age: true,
                    avatar: true,
                    isOnline: true,
                    createdAt: true
                })
            });
        });
    });

    describe('getFullUserByEmailOrId', () => {
        it('should return a user by email or id', async () => {
            const id = 1;
            const mockUser = mockFullUserData;

            jest.spyOn(mockPrismaService.users, 'findFirst').mockResolvedValue(mockUser);

            const result = await service.getFullUserByEmailOrId(id);

            expect(result).toEqual(mockUser);
            expect(mockPrismaService.users.findFirst).toHaveBeenCalledWith({
                where: { OR: [{ id }, { email: '' }] },
                select: expect.objectContaining({
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
                })
            });
        });
    });
});
