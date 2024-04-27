import { Injectable } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';

@Injectable()
export class TokenService {
    constructor(private readonly prismaService: PrismaService) {}

    public async storeRefreshToken(userId: number, hash: string): Promise<void> {
        await this.prismaService.userTokens.create({
            data: {
                userId,
                refreshTokenHash: hash
            }
        });
    }

    public async getTokenByUserId(userId: number): Promise<string> {
        const { refreshTokenHash } = await this.prismaService.userTokens.findFirst({
            where: {
                userId
            },
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                refreshTokenHash: true
            }
        });

        return refreshTokenHash;
    }

    public async deleteRefreshTokensByUserId(userId: number): Promise<void> {
        await this.prismaService.userTokens.deleteMany({
            where: {
                userId
            }
        });
    }
}
