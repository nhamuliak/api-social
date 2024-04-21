import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PayloadModel, TokenModel } from '@models/index';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@utils/constants';

const jwtService = new JwtService();

export async function compareProperties(property: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(property, hash);
}

export async function hashProperty(property: string): Promise<string> {
    const salt = await bcrypt.genSalt();

    return await bcrypt.hash(property, salt);
}

export async function getTokens(payload: PayloadModel): Promise<TokenModel> {
    return {
        accessToken: await getAccessToken(payload),
        refreshToken: await getRefreshToken(payload)
    };
}

export async function getAccessToken(payload: PayloadModel): Promise<string> {
    return await jwtService.signAsync(payload, {
        expiresIn: '60s', // TODO:: change it to min "30m"
        secret: ACCESS_TOKEN_KEY
    });
}

export async function getRefreshToken(payload: PayloadModel): Promise<string> {
    return await jwtService.signAsync(payload, {
        expiresIn: '3d',
        secret: REFRESH_TOKEN_KEY
    });
}
