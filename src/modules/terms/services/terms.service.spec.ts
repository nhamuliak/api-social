import { Test, TestingModule } from '@nestjs/testing';
import { TermsService } from './terms.service';
import { TermsModel } from '@models/terms.model';
import { mockTermsListData } from '@mock/data';
import { PrismaService } from '@business/prisma.service';

const mockPrismaService = {
    terms: {
        findMany: jest.fn().mockReturnValue([])
    }
};

describe('TermsService', () => {
    let service: TermsService;
    let prismaService: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TermsService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService
                }
            ]
        }).compile();

        service = module.get<TermsService>(TermsService);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getTerms', () => {
        it('should return terms from the database', async () => {
            const mockTerms: TermsModel[] = mockTermsListData;

            jest.spyOn(prismaService.terms, 'findMany').mockResolvedValue(mockTerms);

            const result = await service.getTerms();

            expect(prismaService.terms.findMany).toHaveBeenCalled();
            expect(result).toEqual(mockTerms);
        });

        it('should return an empty array if no terms are found', async () => {
            jest.spyOn(prismaService.terms, 'findMany').mockResolvedValue([]);

            const result = await service.getTerms();

            expect(prismaService.terms.findMany).toHaveBeenCalled();
            expect(result).toEqual([]);
        });
    });
});
