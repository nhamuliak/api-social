import { INestApplication, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TermsService } from '@modules/terms/services/terms.service';

describe('TermsController (e2e)', () => {
    let app: INestApplication;
    let termsService: TermsService;
    const apiUrl = '/api/terms';

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
            providers: [TermsService]
        })
            .overrideProvider(TermsService)
            .useValue({
                getTerms: jest.fn().mockResolvedValue([
                    { id: 1, title: 'Term 1', content: 'Content for term 1' },
                    { id: 2, title: 'Term 2', content: 'Content for term 2' }
                ]) // Mocked terms data
            })
            .compile();

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();

        termsService = moduleFixture.get<TermsService>(TermsService);
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /terms', () => {
        it('should return a list of terms with status 200', async () => {
            const response = await request(app.getHttpServer()).get(apiUrl).expect(HttpStatus.OK);

            expect(response.body).toEqual([
                { id: 1, title: 'Term 1', content: 'Content for term 1' },
                { id: 2, title: 'Term 2', content: 'Content for term 2' }
            ]);
            expect(termsService.getTerms).toHaveBeenCalled(); // Verify service method was called
        });

        it('should return an empty array if no terms are found', async () => {
            jest.spyOn(termsService, 'getTerms').mockResolvedValueOnce([]);

            const response = await request(app.getHttpServer()).get(apiUrl).expect(HttpStatus.OK);

            expect(response.body).toEqual([]);
        });
    });
});
