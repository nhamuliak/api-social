import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { ChatPrismaService } from '@business/services/chat-prisma/chat-prisma.service';
import { MockChatPrismaService, MockUserPrismaService } from '@mock/prisma-service';
import { UserPrismaService } from '@business/services/user-prisma/user-prisma.service';
import { BadRequestException } from '@nestjs/common';
import {
    mockConversationData,
    mockConversationListData,
    mockConversationMessageData,
    mockMessageListData,
    mockUserData
} from '@mock/data';

describe('ChatService', () => {
    let service: ChatService;
    let mockChatPrismaService: ChatPrismaService;
    let mockUserPrismaService: UserPrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatService,
                {
                    provide: ChatPrismaService,
                    useClass: MockChatPrismaService
                },
                {
                    provide: UserPrismaService,
                    useClass: MockUserPrismaService
                }
            ]
        }).compile();

        service = module.get<ChatService>(ChatService);
        mockChatPrismaService = module.get<ChatPrismaService>(ChatPrismaService);
        mockUserPrismaService = module.get<UserPrismaService>(UserPrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getConversationsByUserId', () => {
        it('should return conversations for the user', async () => {
            const userId = 1;
            const mockConversations = mockConversationListData;

            jest.spyOn(mockChatPrismaService, 'getConversationsByUserId').mockResolvedValue(mockConversations);

            const result = await service.getConversationsByUserId(userId);

            expect(result).toEqual(mockConversations);
            expect(mockChatPrismaService.getConversationsByUserId).toHaveBeenCalledWith(userId);
        });
    });

    describe('getMessagesByConversationId', () => {
        it('should return paginated messages for a conversation', async () => {
            const id = 1;
            const page = 1;
            const size = 10;
            const mockMessages = { records: mockMessageListData, total: mockMessageListData.length };

            jest.spyOn(mockChatPrismaService, 'getConversationById').mockResolvedValue(1);
            jest.spyOn(mockChatPrismaService, 'getMessagesByRoomId').mockResolvedValue(mockMessages);

            const result = await service.getMessagesByConversationId(id, page, size);

            expect(result).toEqual(mockMessages);
            expect(mockChatPrismaService.getConversationById).toHaveBeenCalledWith(id);
            expect(mockChatPrismaService.getMessagesByRoomId).toHaveBeenCalledWith(id, page, size);
        });

        it('should throw BadRequestException if conversation is not found', async () => {
            const id = 1;
            const page = 1;
            const size = 10;

            jest.spyOn(mockChatPrismaService, 'getConversationById').mockResolvedValue(null);

            await expect(service.getMessagesByConversationId(id, page, size)).rejects.toThrow(BadRequestException);
        });
    });

    describe('sendMessage', () => {
        it('should send a message and return conversation data', async () => {
            const roomId = 1;
            const senderId = 1;
            const receiverId = 2;

            const user = mockUserData;
            const newMessage = mockConversationMessageData;
            const mockConversation = mockConversationData;

            jest.spyOn(mockChatPrismaService, 'getConversationById').mockResolvedValue(roomId);
            jest.spyOn(mockChatPrismaService, 'createMessage').mockResolvedValue(newMessage);
            jest.spyOn(mockChatPrismaService, 'getUnreadMessagesByRoom').mockResolvedValue(0);
            jest.spyOn(mockUserPrismaService, 'getUserById').mockResolvedValue(user);

            const result = await service.sendMessage(roomId, senderId, receiverId, newMessage.text);

            expect(result).toEqual(mockConversation);
            expect(mockChatPrismaService.createMessage).toHaveBeenCalledWith(senderId, roomId, newMessage.text);
        });

        it('should throw BadRequestException if the conversation is not found', async () => {
            const roomId = 1;
            const senderId = 1;
            const receiverId = 2;
            const content = 'Hello';

            jest.spyOn(mockChatPrismaService, 'getConversationById').mockResolvedValue(null);

            await expect(service.sendMessage(roomId, senderId, receiverId, content)).rejects.toThrow(
                BadRequestException
            );
        });

        it('should throw BadRequestException if sender is not found', async () => {
            const roomId = 1;
            const senderId = 1;
            const receiverId = 2;
            const content = 'Hello';

            jest.spyOn(mockChatPrismaService, 'getConversationById').mockResolvedValue(1);
            jest.spyOn(mockUserPrismaService, 'getUserById').mockResolvedValue(null);

            await expect(service.sendMessage(roomId, senderId, receiverId, content)).rejects.toThrow(
                BadRequestException
            );
        });
    });

    describe('updateMessagesReadStatus', () => {
        it('should update the read status of messages', async () => {
            const roomId = 1;
            const senderId = 1;
            const user = mockUserData;

            jest.spyOn(mockChatPrismaService, 'getConversationById').mockResolvedValue(roomId);
            jest.spyOn(mockChatPrismaService, 'updateMessagesReadStatus').mockResolvedValue(undefined);
            jest.spyOn(mockUserPrismaService, 'getUserById').mockResolvedValue(user);

            await service.updateMessagesReadStatus(roomId, senderId);

            expect(mockChatPrismaService.updateMessagesReadStatus).toHaveBeenCalledWith(roomId, senderId);
        });

        it('should throw BadRequestException if sender is not found', async () => {
            const roomId = 1;
            const senderId = 1;

            jest.spyOn(mockUserPrismaService, 'getUserById').mockResolvedValue(null);

            await expect(service.updateMessagesReadStatus(roomId, senderId)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if room is not found', async () => {
            const roomId = 1;
            const senderId = 1;

            jest.spyOn(mockChatPrismaService, 'getConversationById').mockResolvedValue(null);

            await expect(service.updateMessagesReadStatus(roomId, senderId)).rejects.toThrow(BadRequestException);
        });
    });

    describe('getReceiverByRoomId', () => {
        it('should return the receiver of the conversation', async () => {
            const roomId = 1;
            const userId = 1;
            const mockReceiver = mockUserData;

            jest.spyOn(mockChatPrismaService, 'getConversationById').mockResolvedValue(roomId);
            jest.spyOn(mockChatPrismaService, 'getReceiverByRoomId').mockResolvedValue(mockUserData);

            const result = await service.getReceiverByRoomId(roomId, userId);

            expect(result).toEqual(mockReceiver);
            expect(mockChatPrismaService.getReceiverByRoomId).toHaveBeenCalledWith(roomId, userId);
        });

        it('should throw BadRequestException if conversation is not found', async () => {
            const roomId = 1;
            const userId = 1;

            jest.spyOn(mockChatPrismaService, 'getConversationById').mockResolvedValue(null);

            await expect(service.getReceiverByRoomId(roomId, userId)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if receiver is not found', async () => {
            const roomId = 1;
            const userId = 1;

            jest.spyOn(mockChatPrismaService, 'getConversationById').mockResolvedValue(roomId);
            jest.spyOn(mockChatPrismaService, 'getReceiverByRoomId').mockResolvedValue(null);

            await expect(service.getReceiverByRoomId(roomId, userId)).rejects.toThrow(BadRequestException);
        });
    });
});
