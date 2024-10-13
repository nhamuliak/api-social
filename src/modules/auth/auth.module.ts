import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { AccessTokenStrategy, RefreshTokenStrategy } from '@core/strategies';
import { AuthService } from './services/auth/auth.service';
import { TokenService } from './services/token/token.service';
import { AuthController } from './auth.controller';
import { MailService } from './services/mail/mail.service';

@Module({
    imports: [JwtModule.register({})],
    controllers: [AuthController],
    providers: [AuthService, AccessTokenStrategy, RefreshTokenStrategy, TokenService, MailService]
})
export class AuthModule {}
