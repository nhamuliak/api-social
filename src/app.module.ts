import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { UserModule } from './modules/user/user.module';
import { TermsModule } from './modules/terms/terms.module';

@Module({
    imports: [AuthModule, PrismaModule, UserModule, TermsModule],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {}
