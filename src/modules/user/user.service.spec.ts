import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserPrismaService } from '@business/services/user-prisma/user-prisma.service';
import { MockUserPrismaService } from '@mock/prisma-service';
import { PaginationModel } from '@models/pagination.model';
import { UserPrismaModel } from '@business/models';
import { mockFullUserData, mockUserData } from '@mock/data';
import { UpdateUserDto } from '@modules/user/dto/update-user.dto';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { FullUserPrismaModel } from '@business/models/user-prisma.model';
import * as bcrypt from 'bcrypt';
import { S3Service } from '@core/services/s3/s3.service';
import { MockS3Service } from '@mock/services';

jest.mock('bcrypt');

describe('UserService', () => {
    let service: UserService;
    let mockUserPrismaService: UserPrismaService;
    let mockS3Service: S3Service;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: UserPrismaService,
                    useClass: MockUserPrismaService
                },
                {
                    provide: S3Service,
                    useClass: MockS3Service
                }
            ]
        }).compile();

        service = module.get<UserService>(UserService);
        mockUserPrismaService = module.get<UserPrismaService>(UserPrismaService);
        mockS3Service = module.get<S3Service>(S3Service);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getUsers', () => {
        it('should return paginated users', async () => {
            const mockPagination: PaginationModel<UserPrismaModel> = {
                total: 1,
                records: [mockUserData]
            };

            jest.spyOn(mockUserPrismaService, 'getUsers').mockResolvedValue(mockPagination);

            const result = await service.getUsers(1);

            expect(mockUserPrismaService.getUsers).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockPagination);
        });
    });

    describe('updateUser', () => {
        it("should throw ForbiddenException if updating another user's profile", async () => {
            const updateUserDto: UpdateUserDto = { firstName: 'Updated' };
            const user: FullUserPrismaModel = { ...mockFullUserData, id: 2 };

            jest.spyOn(mockUserPrismaService, 'getFullUserByEmailOrId').mockResolvedValue(user);

            await expect(service.updateUser(1, 1, updateUserDto)).rejects.toThrow(ForbiddenException);
            expect(mockUserPrismaService.getFullUserByEmailOrId).toHaveBeenCalledWith(1);
        });

        it('should throw BadRequestException if user not found', async () => {
            jest.spyOn(mockUserPrismaService, 'getFullUserByEmailOrId').mockResolvedValue(null);

            await expect(service.updateUser(1, 1, {})).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if old password does not match', async () => {
            const updateUserDto: UpdateUserDto = { oldPassword: 'wrongPassword', password: 'newPassword' };
            const mockUser: FullUserPrismaModel = { ...mockFullUserData, password: 'hashedPassword' };

            jest.spyOn(mockUserPrismaService, 'getFullUserByEmailOrId').mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.updateUser(1, 1, updateUserDto)).rejects.toThrow(BadRequestException);
            expect(bcrypt.compare).toHaveBeenCalledWith('wrongPassword', 'hashedPassword');
        });

        it('should update password if old password matches', async () => {
            const updateUserDto: UpdateUserDto = { oldPassword: 'correctPassword', password: 'newPassword' };
            const mockUser = { ...mockFullUserData, password: 'hashedNewPassword' };

            jest.spyOn(mockUserPrismaService, 'getFullUserByEmailOrId').mockResolvedValue(mockUser);

            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedNewPassword');

            jest.spyOn(mockUserPrismaService, 'updateUserById').mockResolvedValue({
                ...mockUser,
                password: 'hashedNewPassword'
            } as UserPrismaModel);

            await service.updateUser(1, 1, updateUserDto);

            expect(bcrypt.compare).toHaveBeenCalledWith('correctPassword', 'hashedNewPassword');
            expect(bcrypt.hash).toHaveBeenCalledWith('newPassword', 10);
        });

        it('should update avatar if file is provided', async () => {
            const updateUserDto: UpdateUserDto = {};
            const mockUser = mockFullUserData;
            const mockFile = { originalname: 'avatar.jpg' } as Express.Multer.File;

            jest.spyOn(mockUserPrismaService, 'getFullUserByEmailOrId').mockResolvedValue(mockUser);
            jest.spyOn(mockS3Service, 'uploadFile').mockResolvedValue('https://s3.example.com/avatar.jpg');

            jest.spyOn(mockUserPrismaService, 'updateUserById').mockResolvedValue({
                ...mockUser,
                avatar: 'https://s3.example.com/avatar.jpg'
            });

            const result = await service.updateUser(1, 1, updateUserDto, mockFile);

            expect(mockS3Service.uploadFile).toHaveBeenCalledWith(mockFile);
            expect(result.avatar).toEqual('https://s3.example.com/avatar.jpg');
        });
    });
});
