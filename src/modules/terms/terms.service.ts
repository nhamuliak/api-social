import { Injectable } from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';
import { TermsModel } from '@models/terms.model';

@Injectable()
export class TermsService {
    constructor(private readonly prismaService: PrismaService) {}

    public getTerms(): Promise<TermsModel[]> {
        return this.prismaService.terms.findMany();
    }
}
