import { Test, TestingModule } from '@nestjs/testing';
import { TermsController } from './terms.controller';
import { TermsService } from './terms.service';
import { mockResponse } from '@mock/helper';
import { TermsModel } from '@models/terms.model';
import { HttpStatus } from '@nestjs/common';
import { MockTermsService } from '@mock/services';
import { mockTermsListData } from '@mock/data';

describe('TermsController', () => {
    let controller: TermsController;
    let mockTermsService: TermsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TermsController],
            providers: [
                {
                    provide: TermsService,
                    useClass: MockTermsService
                }
            ]
        }).compile();

        controller = module.get<TermsController>(TermsController);
        mockTermsService = module.get<TermsService>(TermsService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getTerms', () => {
        it('should return terms with status 200', async () => {
            const res = mockResponse();
            const terms: TermsModel[] = mockTermsListData;

            jest.spyOn(mockTermsService, 'getTerms').mockResolvedValue(terms);

            await controller.getTerms(res);

            expect(mockTermsService.getTerms).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(res.send).toHaveBeenCalledWith(terms);
        });

        it('should handle empty terms array', async () => {
            const res = mockResponse();
            const emptyTerms: TermsModel[] = [];

            jest.spyOn(mockTermsService, 'getTerms').mockResolvedValue(emptyTerms);

            await controller.getTerms(res);

            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(res.send).toHaveBeenCalledWith(emptyTerms);
        });
    });
});
