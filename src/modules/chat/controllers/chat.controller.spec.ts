import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from '@modules/chat/services/chat.service';
import { MockChatService } from '@mock/services';
import { HttpStatus } from '@nestjs/common';
import { mockResponse } from '@mock/helper';
import { ChatGateway } from '@modules/chat/gateways/chat.gateway';
import {
    mockConversationData,
    mockConversationListData,
    mockCreateMessageData,
    mockMessageListData,
    mockUserData
} from '@mock/data';
import { PaginationModel } from '@models/pagination.model';
import { MessagePrismaModel } from '@business/models/chat-prisma.model';
import { MessageDto } from '@modules/chat/dto';
import { UserPrismaModel } from '@business/models';

describe('ChatController', () => {
    let controller: ChatController;
    let mockChatService: ChatService;
    let mockChatGateway: ChatGateway;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ChatController],
            providers: [
                {
                    provide: ChatService,
                    useClass: MockChatService
                },
                {
                    provide: ChatGateway,
                    useValue: {
                        notifyRoomDeleted: jest.fn(),
                        notifyCreatedMessage: jest.fn()
                    }
                }
            ]
        }).compile();

        controller = module.get<ChatController>(ChatController);
        mockChatService = module.get<ChatService>(ChatService);
        mockChatGateway = module.get<ChatGateway>(ChatGateway);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getConversations', () => {
        it('should return conversations with status 200', async () => {
            const res = mockResponse();
            const conversations = mockConversationListData;

            jest.spyOn(mockChatService, 'getConversationsByUserId').mockResolvedValue(conversations);

            await controller.getConversations(1, res);

            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(res.send).toHaveBeenCalledWith(conversations);
        });
    });

    describe('createConversation', () => {
        it('should create a new conversation or return an existing one', async () => {
            const res = mockResponse();
            const existingRoom = { roomId: 1 };
            const newRoomId = 456;

            jest.spyOn(mockChatService, 'checkIfConversationExists').mockResolvedValue(existingRoom);

            await controller.createConversation(1, { receiverId: 2 }, res);

            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(res.send).toHaveBeenCalledWith(existingRoom);

            jest.spyOn(mockChatService, 'checkIfConversationExists').mockResolvedValue({ roomId: null });
            jest.spyOn(mockChatService, 'createConversation').mockResolvedValue(newRoomId);

            await controller.createConversation(1, { receiverId: 2 }, res);

            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(res.send).toHaveBeenCalledWith({ roomId: newRoomId });
        });
    });

    describe('deleteConversationByRoomId', () => {
        it('should delete a conversation and notify via gateway', async () => {
            const res = mockResponse();

            jest.spyOn(mockChatService, 'deleteConversationByRoomId').mockResolvedValue(undefined);

            await controller.deleteConversationByRoomId(123, { receiverId: 2 }, res);

            expect(mockChatService.deleteConversationByRoomId).toHaveBeenCalledWith(123);
            expect(mockChatGateway.notifyRoomDeleted).toHaveBeenCalledWith(123, 2);
            expect(res.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
            expect(res.send).toHaveBeenCalled();
        });
    });

    describe('createMessage', () => {
        it('should create a message and notify the receiver', async () => {
            const res = mockResponse();
            const mockConversation = mockConversationData;

            jest.spyOn(mockChatService, 'sendMessage').mockResolvedValue(mockConversation);

            await controller.createMessage(1, { roomId: 123, receiverId: 2, content: 'Hello' }, res);

            expect(mockChatService.sendMessage).toHaveBeenCalledWith(123, 1, 2, 'Hello');
            expect(mockChatGateway.notifyCreatedMessage).toHaveBeenCalledWith(2, mockConversation);
            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(res.send).toHaveBeenCalledWith({
                ...mockConversation.message,
                user: mockConversation.user
            });
        });
    });

    describe('getMessagesByConversationId', () => {
        it('should return messages with pagination', async () => {
            const res = mockResponse();
            const mockMessages: PaginationModel<MessagePrismaModel> = {
                records: mockMessageListData,
                total: 2
            };

            jest.spyOn(mockChatService, 'getMessagesByConversationId').mockResolvedValue(mockMessages);

            await controller.getMessagesByConversationId(1, { page: 1, size: 10 }, res);

            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(res.send).toHaveBeenCalledWith(mockMessages);
        });
    });

    describe('createMessage', () => {
        it('should create a message and notify the receiver', async () => {
            const res = mockResponse();
            const messageDto: MessageDto = mockCreateMessageData;
            const mockConversation = mockConversationData;

            jest.spyOn(mockChatService, 'sendMessage').mockResolvedValue(mockConversation);

            await controller.createMessage(1, messageDto, res);

            expect(mockChatService.sendMessage).toHaveBeenCalledWith(
                messageDto.roomId,
                mockConversation.user.id,
                messageDto.receiverId,
                messageDto.content
            );
            expect(mockChatGateway.notifyCreatedMessage).toHaveBeenCalledWith(2, mockConversation);
            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(res.send).toHaveBeenCalledWith({
                ...mockConversation.message,
                user: mockConversation.user
            });
        });
    });

    describe('getReceiverByRoomId', () => {
        it('should return receiver details for the conversation', async () => {
            const res = mockResponse();
            const mockReceiver: UserPrismaModel = { ...mockUserData, firstName: 'Receiver' };

            jest.spyOn(mockChatService, 'getReceiverByRoomId').mockResolvedValue(mockReceiver);

            await controller.getReceiverByRoomId(1, 1, res);

            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(res.send).toHaveBeenCalledWith(mockReceiver);
        });
    });
});
