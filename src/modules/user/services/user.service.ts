import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { UserPrismaService } from '@business/services/user-prisma/user-prisma.service';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from '@modules/user/dto/update-user.dto';
import { S3Service } from '@core/services/s3/s3.service';
import { PaginationModel, UserPrismaModel } from '@business/models';

@Injectable()
export class UserService {
    constructor(
        private readonly userPrismaService: UserPrismaService,
        private readonly s3Service: S3Service
    ) {}

    public async getUsers(userId: number): Promise<PaginationModel<UserPrismaModel>> {
        return await this.userPrismaService.getUsers(userId);
    }

    public async updateUser(
        userId: number,
        currentUserId: number,
        updateUserDto: UpdateUserDto,
        file: Express.Multer.File = null
    ): Promise<UserPrismaModel> {
        const user = await this.userPrismaService.getFullUserByEmailOrId(userId);

        if (!user) {
            throw new BadRequestException('The user has not found.');
        }

        if (currentUserId !== user.id) {
            throw new ForbiddenException("You cannot update stranger's profile.");
        }

        if (updateUserDto.oldPassword && updateUserDto.password) {
            const isMatch = await bcrypt.compare(updateUserDto.oldPassword, user.password);

            if (!isMatch) {
                throw new BadRequestException('The old password is not correct.');
            }

            updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);

            delete updateUserDto.oldPassword;
        } else {
            delete updateUserDto.oldPassword;
            delete updateUserDto.password;
        }

        if (file) {
            const filePath = await this.s3Service.uploadFile(file);

            updateUserDto.avatar = filePath;
        }

        const updatedUser = await this.userPrismaService.updateUserById(userId, updateUserDto);

        return updatedUser;
    }
}
