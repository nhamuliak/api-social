import {
    Controller,
    Body,
    Patch,
    Param,
    Res,
    HttpStatus,
    Get,
    UseInterceptors,
    UploadedFile,
    UseGuards
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from '@core/decorators';
import { AccessGuard } from '@core/guards/access/access.guard';
import { UserModel } from '@models/user.model';
import { PaginationModel } from '@business/models';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get()
    @UseGuards(AccessGuard)
    async getUsers(@User('id') userId: number, @Res() res: Response): Promise<Response<PaginationModel<UserModel>>> {
        const { total, records } = await this.userService.getUsers(userId);

        return res.status(HttpStatus.OK).send({
            total,
            records
        });
    }

    @UseGuards(AccessGuard)
    @Patch(':id')
    @UseInterceptors(FileInterceptor('file'))
    async update(
        @Param('id') id: number,
        @Body() updateUserDto: UpdateUserDto,
        @UploadedFile() file: Express.Multer.File,
        @Res() res: Response,
        @User('id') userId: number
    ): Promise<Response<UserModel>> {
        const updatedUser = await this.userService.updateUser(+id, +userId, updateUserDto, file);

        return res.status(HttpStatus.OK).send(updatedUser);
    }
}
