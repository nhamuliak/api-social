import { Test, TestingModule } from '@nestjs/testing';
import { AccessGuard } from '@core/guards/access/access.guard';
import { ExecutionContext, HttpStatus } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { UserService } from '@modules/user/services/user.service';
import { UserController } from '@modules/user/controllers/user.controller';

describe('UserController', () => {
    let app: INestApplication;
    const apiUrl = '/api/user';

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UserController],
            providers: [
                {
                    provide: UserService,
                    useValue: {
                        getUsers: jest.fn().mockResolvedValue({
                            total: 1,
                            records: [
                                {
                                    id: 1,
                                    name: 'John Doe',
                                    email: 'john.doe@example.com'
                                }
                            ]
                        }),
                        updateUser: jest.fn().mockResolvedValue({
                            id: 1,
                            name: 'Updated User',
                            email: 'updated.email@example.com'
                        })
                    }
                }
            ]
        })
            // Mock AccessGuard to always pass authorization checks
            .overrideGuard(AccessGuard)
            .useValue({
                canActivate: (context: ExecutionContext) => {
                    const request = context.switchToHttp().getRequest();
                    request.user = { id: 1 }; // Mock user with an id
                    return true;
                }
            })
            .compile();

        app = module.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();
    });

    it('should get users', async () => {
        const response = await request(app.getHttpServer())
            .get(apiUrl)
            .set('Authorization', 'Bearer valid-token')
            .expect(HttpStatus.OK);

        expect(response.body.total).toBe(1);
        expect(response.body.records).toHaveLength(1);
        expect(response.body.records[0].name).toBe('John Doe');
        expect(response.body.records[0].email).toBe('john.doe@example.com');
    });

    it('should update a user', async () => {
        const updateUserDto = {
            name: 'Updated User',
            email: 'updated.email@example.com'
        };

        const response = await request(app.getHttpServer())
            .patch(`${apiUrl}/1`)
            .set('Authorization', 'Bearer valid-token')
            .send(updateUserDto)
            .expect(HttpStatus.OK);

        expect(response.body.id).toBe(1);
        expect(response.body.name).toBe('Updated User');
        expect(response.body.email).toBe('updated.email@example.com');
    });

    afterAll(async () => {
        await app.close();
    });
});
