import { Injectable } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';

@Injectable()
export class TermsService {
    constructor(private readonly prismaService: PrismaService) {}

    public getTerms(): Promise<any> {
        return this.prismaService.terms.findMany();
    }
}
