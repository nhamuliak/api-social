import { Strategy, ExtractJwt } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { PayloadModel } from '@models/payload.model';
import { ACCESS_STRATEGY_NAME, ACCESS_TOKEN_KEY } from '@utils/constants';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, ACCESS_STRATEGY_NAME) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: ACCESS_TOKEN_KEY
        });
    }

    public validate(payload: PayloadModel): PayloadModel {
        return payload;
    }
}
