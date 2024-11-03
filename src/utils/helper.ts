import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PayloadModel, TokenModel } from '@models/index';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@utils/constants';
import { BadRequestException } from '@nestjs/common';

const jwtService = new JwtService();

export async function compareProperties(property: string, hash: string): Promise<boolean> {
    try {
        return await bcrypt.compare(property, hash);
    } catch (err) {
        console.error(err);

        return null;
    }
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

export async function getAccessToken(payload: PayloadModel, expiresIn: string = '1d'): Promise<string> {
    return await jwtService.signAsync(payload, {
        expiresIn,
        secret: ACCESS_TOKEN_KEY
    });
}

export async function getRefreshToken(payload: PayloadModel, expiresIn: string = '3d'): Promise<string> {
    return await jwtService.signAsync(payload, {
        expiresIn,
        secret: REFRESH_TOKEN_KEY
    });
}

export async function verifyToken(token: string): Promise<PayloadModel> {
    try {
        return jwtService.verify(token, {
            secret: ACCESS_TOKEN_KEY
        });
    } catch (err) {
        throw new BadRequestException('Token has expired.');
    }
}

export async function verifyRefreshToken(token: string): Promise<PayloadModel> {
    try {
        return jwtService.verify(token, {
            secret: REFRESH_TOKEN_KEY
        });
    } catch (err) {
        throw new BadRequestException('Refresh token has expired.');
    }
}
