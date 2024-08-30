import * as bcrypt from 'bcrypt';
import {
    Controller,
    Body,
    Patch,
    Param,
    Res,
    HttpStatus,
    BadRequestException,
    Get,
    Query,
    UseInterceptors,
    UploadedFile
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { Response } from 'express';
import { FilterUserDto } from '@modules/user/dto/filter-user.dto';
import { S3Service } from '@core/services/s3/s3.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('user')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly s3Service: S3Service
    ) {}

    @Get()
    async getUsers(@Query() { firstName, lastName, page }: FilterUserDto, @Res() res: Response) {
        try {
            const [count, users] = await this.userService.getUsers(firstName, lastName, +page);

            res.status(HttpStatus.OK).send({
                count,
                records: users
            });
        } catch (err) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
        }
    }

    @Patch(':id')
    @UseInterceptors(FileInterceptor('file'))
    async update(
        @Param('id') id: string,
        @Body() updateUserDto: UpdateUserDto,
        @UploadedFile() file: Express.Multer.File,
        @Res() res: Response
    ) {
        const user = await this.userService.getUserById(+id);

        if (!user) {
            throw new BadRequestException('The user has not found.');
        }

        if (updateUserDto.oldPassword && updateUserDto.password) {
            const isMatch = await bcrypt.compare(user.password, updateUserDto.oldPassword);

            if (!isMatch) {
                throw new BadRequestException('The old password is not correct.');
            }

            updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
        } else {
            delete updateUserDto.oldPassword;
            delete updateUserDto.password;
        }

        if (file) {
            const filePath = await this.s3Service.uploadFile(file);

            updateUserDto.avatar = filePath;
        }

        const updatedUser = await this.userService.updateUserById(+id, updateUserDto);

        return res.status(HttpStatus.OK).send({
            userId: id,
            data: updatedUser
        });
    }
}
