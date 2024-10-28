import { Global, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { S3Service } from '@core/services/s3/s3.service';
import { PrismaModule } from '@business/prisma.module';

@Global()
@Module({
    imports: [PrismaModule],
    controllers: [UserController],
    providers: [UserService, S3Service],
    exports: [UserService]
})
export class UserModule {}
