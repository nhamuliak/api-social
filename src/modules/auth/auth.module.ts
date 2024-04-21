import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { AccessTokenStrategy, RefreshTokenStrategy } from '@core/strategies';
import { AuthService } from './services/auth/auth.service';
import { TokenService } from './services/token/token.service';
import { AuthController } from './auth.controller';

@Module({
    imports: [JwtModule.register({})],
    controllers: [AuthController],
    providers: [AuthService, AccessTokenStrategy, RefreshTokenStrategy, TokenService]
})
export class AuthModule {}
