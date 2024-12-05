import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway';
import { ChatService } from '../services/chat.service';
import { MockChatService } from '@mock/services';
import { UserPrismaService } from '@business/services/user-prisma/user-prisma.service';
import { MockUserPrismaService } from '@mock/prisma-service';
import { Server, Socket } from 'socket.io';
import { UnauthorizedException } from '@nestjs/common';
import { mockConversationData, mockUserData } from '@mock/data';
import { verifyToken } from '@utils/helper';

jest.mock('@utils/helper');

describe('ChatGateway', () => {
    let gateway: ChatGateway;
    let mockChatService: ChatService;
    let mockUserPrismaService: UserPrismaService;
    let socket: Socket;
    let server: Server;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatGateway,
                {
                    provide: ChatService,
                    useClass: MockChatService
                },
                {
                    provide: UserPrismaService,
                    useClass: MockUserPrismaService
                }
            ]
        }).compile();

        gateway = module.get<ChatGateway>(ChatGateway);
        mockChatService = module.get<ChatService>(ChatService);
        mockUserPrismaService = module.get<UserPrismaService>(UserPrismaService);

        // Mock socket and server
        server = { emit: jest.fn(), to: jest.fn().mockReturnThis() } as unknown as Server;
        socket = {
            emit: jest.fn(),
            disconnect: jest.fn(),
            handshake: { headers: { authorization: 'valid_token' } },
            data: {}
        } as unknown as Socket;

        gateway['server'] = server;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    describe('handleConnection', () => {
        it('should set userId in socket data and update user online status', async () => {
            const mockUser = mockUserData;

            (verifyToken as jest.Mock).mockResolvedValue(mockUser);
            jest.spyOn(mockUserPrismaService, 'getUserById').mockResolvedValue(mockUser);

            await gateway.handleConnection(socket);

            expect(mockUserPrismaService.getUserById).toHaveBeenCalledWith(1);
            expect(socket.data.userId).toBe(mockUser.id);
            expect(mockUserPrismaService.updateUserOnlineStatusById).toHaveBeenCalledWith(1, true);
            expect(server.emit).toHaveBeenCalledWith('online-users', [1]);
        });

        it('should disconnect socket if user is not found', async () => {
            // mockVerifyToken.mockResolvedValue({ id: 1 });
            (verifyToken as jest.Mock).mockResolvedValue(null);
            // userPrismaService.getUserById = jest.fn().mockResolvedValue(null);
            jest.spyOn(mockUserPrismaService, 'getUserById').mockResolvedValue(null);

            await gateway.handleConnection(socket);

            expect(socket.disconnect).toHaveBeenCalled();
        });

        it('should handle invalid token gracefully', async () => {
            (verifyToken as jest.Mock).mockResolvedValue(new UnauthorizedException());

            await gateway.handleConnection(socket);

            expect(socket.disconnect).toHaveBeenCalled();
        });
    });

    describe('handleDisconnect', () => {
        it('should update user status and emit online-users', async () => {
            socket.data.userId = 1;

            jest.spyOn(mockUserPrismaService, 'updateUserOnlineStatusById').mockResolvedValue(null);

            await gateway.handleDisconnect(socket);

            expect(mockUserPrismaService.updateUserOnlineStatusById).toHaveBeenCalledWith(1, false);
            expect(server.emit).toHaveBeenCalledWith('online-users', []);
        });
    });

    describe('handleGetOnlineUsers', () => {
        it('should emit online-users event', () => {
            gateway.handleGetOnlineUsers(socket);

            expect(socket.emit).toHaveBeenCalledWith('online-users', []);
        });
    });

    describe('handleUnreadMessages', () => {
        it('should update the message read status', async () => {
            const roomId = 1;
            const senderId = 2;

            // chatService.updateMessagesReadStatus = jest.fn();

            await gateway.handleUnreadMessages({ roomId, senderId });

            expect(mockChatService.updateMessagesReadStatus).toHaveBeenCalledWith(roomId, senderId);
        });
    });

    describe('notifyCreatedMessage', () => {
        it('should notify the receiver about the new message', async () => {
            const receiverId = 1;
            const conversation = mockConversationData;
            const mockUser = mockUserData;

            (verifyToken as jest.Mock).mockResolvedValue(mockUser);
            jest.spyOn(mockUserPrismaService, 'getUserById').mockResolvedValue(mockUser);

            await gateway.handleConnection(socket);

            gateway.notifyCreatedMessage(receiverId, conversation);

            expect(server.to).toHaveBeenCalled();
            expect(server.to).toHaveBeenCalled();
        });
    });

    describe('notifyRoomDeleted', () => {
        it('should notify the receiver about room deletion', () => {
            const roomId = 1;
            const receiverId = 1;

            gateway.notifyRoomDeleted(roomId, receiverId);

            expect(server.to).toHaveBeenCalled();
        });
    });
});
