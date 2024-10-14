import { Strategy, ExtractJwt } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { PayloadModel } from '@models/payload.model';
import { ACCESS_TOKEN_KEY, SOCKET_STRATEGY_NAME } from '@utils/constants';

@Injectable()
export class SocketStrategy extends PassportStrategy(Strategy, SOCKET_STRATEGY_NAME) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: ACCESS_TOKEN_KEY
        });
    }

    public validate(payload: PayloadModel): PayloadModel {
        return payload;
    }
}
