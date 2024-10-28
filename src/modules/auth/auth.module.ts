import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { AccessTokenStrategy, GoogleStrategy, RefreshTokenStrategy } from '@core/strategies';
import { AuthService } from './services/auth/auth.service';
import { TokenService } from './services/token/token.service';
import { AuthController } from './auth.controller';
import { MailService } from './services/mail/mail.service';
import { PassportModule } from '@nestjs/passport';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '@business/prisma.module';

@Module({
    imports: [HttpModule, PassportModule, PrismaModule, JwtModule.register({})],
    controllers: [AuthController],
    providers: [AuthService, AccessTokenStrategy, RefreshTokenStrategy, GoogleStrategy, TokenService, MailService]
})
export class AuthModule {}
