import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import * as process from 'process';

@Module({
    imports: [
        JwtModule.register({
            global: true,
            secret: process.env.SECRET,
            signOptions: {
                expiresIn: 15 * 60 // 15 min
            }
        })
    ],
    controllers: [AuthController],
    providers: [AuthService]
})
export class AuthModule {}
