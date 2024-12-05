import { INestApplication, HttpStatus, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { ChatService } from '@modules/chat/services/chat.service';
import { ChatGateway } from '@modules/chat/gateways/chat.gateway';
import { AccessGuard } from '@core/guards/access/access.guard';

describe('ChatController (e2e)', () => {
    let app: INestApplication;
    let chatService: ChatService;
    let chatGateway: ChatGateway;
    const apiUrl = '/api/chat';

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule]
        })
            .overrideProvider(ChatService)
            .useValue({
                getConversationsByUserId: jest.fn().mockResolvedValue([]),
                getLatestConversations: jest.fn().mockResolvedValue([]),
                checkIfConversationExists: jest.fn().mockResolvedValue({ roomId: 1 }),
                createConversation: jest.fn().mockResolvedValue(2),
                deleteConversationByRoomId: jest.fn().mockResolvedValue(undefined),
                getMessagesByConversationId: jest.fn().mockResolvedValue({
                    records: [],
                    total: 0
                }),
                sendMessage: jest.fn().mockResolvedValue({
                    message: { id: 1, content: 'Hello' },
                    user: { id: 1, name: 'User' }
                }),
                getReceiverByRoomId: jest.fn().mockResolvedValue({ id: 2, name: 'Receiver' })
            })
            .overrideProvider(ChatGateway)
            .useValue({
                notifyRoomDeleted: jest.fn(),
                notifyCreatedMessage: jest.fn()
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

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();

        chatService = moduleFixture.get<ChatService>(ChatService);
        chatGateway = moduleFixture.get<ChatGateway>(ChatGateway);
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /chat', () => {
        it('should return user conversations', async () => {
            const response = await request(app.getHttpServer())
                .get(`${apiUrl}`)
                .set('Authorization', 'Bearer mock-token')
                .expect(HttpStatus.OK);

            expect(response.body).toEqual([]);
            expect(chatService.getConversationsByUserId).toHaveBeenCalled();
        });
    });

    describe('GET /chat/:id/latest-conversations', () => {
        it('should return latest conversations for a user', async () => {
            const response = await request(app.getHttpServer())
                .get(`${apiUrl}/1/latest-conversations`)
                .set('Authorization', 'Bearer mock-token')
                .expect(HttpStatus.OK);

            expect(response.body).toEqual([]);
            expect(chatService.getLatestConversations).toHaveBeenCalledWith(1, expect.any(Number));
        });
    });

    describe('POST /chat', () => {
        it('should create a new conversation', async () => {
            const response = await request(app.getHttpServer())
                .post(`${apiUrl}`)
                .set('Authorization', 'Bearer mock-token')
                .send({ receiverId: 2 })
                .expect(HttpStatus.OK);

            expect(response.body).toEqual({ roomId: 1 });
            expect(chatService.checkIfConversationExists).toHaveBeenCalledWith(expect.any(Number), 2);
        });
    });

    describe('DELETE /chat/:id', () => {
        it('should delete a conversation by room ID', async () => {
            await request(app.getHttpServer())
                .delete(`${apiUrl}/1`)
                .set('Authorization', 'Bearer mock-token')
                .send({ receiverId: 2 })
                .expect(HttpStatus.NO_CONTENT);

            expect(chatService.deleteConversationByRoomId).toHaveBeenCalledWith(1);
            expect(chatGateway.notifyRoomDeleted).toHaveBeenCalledWith(1, 2);
        });
    });

    describe('GET /chat/:id/messages', () => {
        it('should get messages by conversation ID', async () => {
            const response = await request(app.getHttpServer())
                .get(`${apiUrl}/1/messages?page=1&size=10`)
                .set('Authorization', 'Bearer mock-token')
                .expect(HttpStatus.OK);

            expect(response.body).toEqual({
                records: [],
                total: 0
            });
            expect(chatService.getMessagesByConversationId).toHaveBeenCalledWith(1, 1, 10);
        });
    });

    describe('POST /chat/message', () => {
        it('should create a message in a conversation', async () => {
            const response = await request(app.getHttpServer())
                .post(`${apiUrl}/message`)
                .set('Authorization', 'Bearer mock-token')
                .send({ roomId: 1, receiverId: 2, content: 'Hello' })
                .expect(HttpStatus.OK);

            expect(response.body).toEqual({ id: 1, content: 'Hello', user: { id: 1, name: 'User' } });
            expect(chatService.sendMessage).toHaveBeenCalledWith(1, expect.any(Number), 2, 'Hello');
            expect(chatGateway.notifyCreatedMessage).toHaveBeenCalledWith(2, expect.any(Object));
        });
    });

    describe('GET /chat/:id/receiver', () => {
        it('should get the receiver by room ID', async () => {
            const response = await request(app.getHttpServer())
                .get(`${apiUrl}/1/receiver`)
                .set('authorization', 'Bearer mock-token')
                .expect(HttpStatus.OK);

            expect(response.body).toEqual({ id: 2, name: 'Receiver' });
            expect(chatService.getReceiverByRoomId).toHaveBeenCalledWith(1, expect.any(Number));
        });
    });
});
