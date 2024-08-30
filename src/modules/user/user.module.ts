import { Global, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { S3Service } from '@core/services/s3/s3.service';

@Global()
@Module({
    controllers: [UserController],
    providers: [UserService, S3Service],
    exports: [UserService]
})
export class UserModule {}
