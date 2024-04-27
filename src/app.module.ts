import { Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/auth.module';
import { PrismaModule } from '@core/prisma/prisma.module';
import { UserModule } from '@modules/user/user.module';
import { TermsModule } from '@modules/terms/terms.module';

@Module({
    imports: [AuthModule, PrismaModule, UserModule, TermsModule],
    controllers: [],
    providers: []
})
export class AppModule {}
