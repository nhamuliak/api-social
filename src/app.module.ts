import { Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/auth.module';
import { PrismaModule } from '@core/prisma/prisma.module';
import { UserModule } from '@modules/user/user.module';
import { TermsModule } from '@modules/terms/terms.module';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from '@modules/chat/chat.module';

@Module({
    imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, PrismaModule, UserModule, TermsModule, ChatModule],
    controllers: []
})
export class AppModule {}
