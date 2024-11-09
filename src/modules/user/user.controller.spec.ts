import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { mockUpdateUserData, mockUserData } from '@mock/data';
import { UserModel } from '@models/user.model';
import { UpdateUserDto } from '@modules/user/dto/update-user.dto';
import { mockResponse } from '@mock/helper';
import { PaginationModel } from '@models/pagination.model';
import { MockUserService } from '@mock/services';

describe('UserController', () => {
    let controller: UserController;
    let mockUserService: UserService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UserController],
            providers: [
                {
                    provide: UserService,
                    useClass: MockUserService
                }
            ]
        }).compile();

        controller = module.get<UserController>(UserController);
        mockUserService = module.get<UserService>(UserService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getUsers', () => {
        it('should return users and pagination data', async () => {
            const res = mockResponse();

            const mockUsers: PaginationModel<UserModel> = {
                total: 1,
                records: [mockUserData]
            };

            jest.spyOn(mockUserService, 'getUsers').mockResolvedValue(mockUsers);

            await controller.getUsers(1, res);

            expect(mockUserService.getUsers).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(mockUsers);
        });
    });

    describe('update', () => {
        it('should update and return the user', async () => {
            const res = mockResponse();

            const mockUser: UserModel = mockUserData;
            const updateUserDto: UpdateUserDto = mockUpdateUserData;
            const mockFile = { originalname: 'avatar.jpg' } as Express.Multer.File;

            jest.spyOn(mockUserService, 'updateUser').mockResolvedValue(mockUser);

            await controller.update(1, updateUserDto, mockFile, res, 1);

            expect(mockUserService.updateUser).toHaveBeenCalledWith(1, 1, updateUserDto, mockFile);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(mockUser);
        });
    });
});
