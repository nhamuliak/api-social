import { Request } from 'express';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { REFRESH_STRATEGY_NAME, REFRESH_TOKEN_KEY } from '@utils/constants';
import { PayloadModel, RefreshPayloadModel } from '@models/payload.model';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, REFRESH_STRATEGY_NAME) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: REFRESH_TOKEN_KEY,
            passReqToCallback: true
        });
    }

    public validate(req: Request, payload: PayloadModel): RefreshPayloadModel {
        const refreshToken = req.get('Authorization').replace('Bearer', '').trim();

        return { ...payload, refreshToken };
    }
}
