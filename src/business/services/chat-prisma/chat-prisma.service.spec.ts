import { Test, TestingModule } from '@nestjs/testing';
import { ChatPrismaService } from './chat-prisma.service';
import { PrismaService } from '@business/prisma.service';
import { MockBasicPrismaService } from '@mock/prisma-service';
import { mockReadMessageData, mockUserData } from '@mock/data';
import { mockRoomMessageData } from '@mock/data/mock-room.data';

describe('ChatPrismaService', () => {
    let service: ChatPrismaService;
    let mockPrismaService: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatPrismaService,
                {
                    provide: PrismaService,
                    useClass: MockBasicPrismaService
                }
            ]
        }).compile();

        service = module.get<ChatPrismaService>(ChatPrismaService);
        mockPrismaService = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getConversationById', () => {
        it('should return conversation id', async () => {
            const roomId = 1;
            const expectedResult = { id: roomId, createdAt: new Date() };

            jest.spyOn(mockPrismaService.rooms, 'findUnique').mockResolvedValue(expectedResult);

            const result = await service.getConversationById(roomId);

            expect(result).toBe(roomId);
            expect(mockPrismaService.rooms.findUnique).toHaveBeenCalledWith({
                where: { id: roomId },
                select: { id: true }
            });
        });
    });

    describe('getLatestConversations', () => {
        it('should return latest conversations with unread messages count', async () => {
            const roomId = 1;
            const userId = 1;
            const mockUser = mockUserData;
            const unreadMessagesCount = 5;

            const mockRoomsResult = [
                {
                    id: 1,
                    roomId: roomId,
                    room: {
                        messages: [mockReadMessageData]
                    },
                    userId: 1,
                    user: mockUser,
                    unreadMessagesCount
                }
            ];

            const expectedMockRooms = [
                {
                    id: 1,
                    roomId: roomId,
                    message: mockReadMessageData,
                    user: mockUser,
                    unreadMessagesCount
                }
            ];

            jest.spyOn(mockPrismaService.messages, 'count').mockResolvedValue(unreadMessagesCount);
            jest.spyOn(mockPrismaService.roomUsers, 'findFirst').mockResolvedValue({ user: mockUser } as any);
            jest.spyOn(mockPrismaService.roomUsers, 'findMany').mockResolvedValue(mockRoomsResult);

            service['getUserByRoom'] = jest.fn().mockResolvedValue(mockUser);
            service['getUnreadMessagesByRoom'] = jest.fn().mockResolvedValue(unreadMessagesCount);

            const result = await service.getLatestConversations(roomId, userId);

            expect(result).toEqual(expectedMockRooms);
        });
    });

    describe('createConversation', () => {
        it('should create a conversation and return room id', async () => {
            const senderId = 1;
            const receiverId = 2;
            const createdRoom = { id: 1, createdAt: new Date() };

            jest.spyOn(mockPrismaService.rooms, 'create').mockResolvedValue(createdRoom);
            jest.spyOn(mockPrismaService.rooms, 'createMany').mockResolvedValue(undefined);

            const result = await service.createConversation(senderId, receiverId);

            expect(result).toBe(1);
            expect(mockPrismaService.rooms.create).toHaveBeenCalledWith({
                data: {},
                select: { id: true }
            });
            expect(mockPrismaService.roomUsers.createMany).toHaveBeenCalledWith({
                data: [
                    { roomId: 1, userId: senderId },
                    { roomId: 1, userId: receiverId }
                ]
            });
        });
    });

    describe('getMessagesByRoomId', () => {
        it('should return messages for the room', async () => {
            const conversationId = 1;
            const page = 1;
            const size = 10;
            const messages = [mockRoomMessageData];
            const total = 1;

            jest.spyOn(mockPrismaService.messages, 'count').mockResolvedValue(total);
            jest.spyOn(mockPrismaService.messages, 'findMany').mockResolvedValue(messages);
            jest.spyOn(mockPrismaService, '$transaction').mockResolvedValue([total, messages]);

            const result = await service.getMessagesByRoomId(conversationId, page, size);

            expect(result).toEqual({
                total,
                records: messages
            });
            expect(mockPrismaService.messages.count).toHaveBeenCalledWith({
                where: { roomId: conversationId }
            });
            expect(mockPrismaService.messages.findMany).toHaveBeenCalledWith({
                where: { roomId: conversationId },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            age: true,
                            avatar: true,
                            isOnline: true,
                            createdAt: true
                        }
                    }
                },
                skip: 0,
                take: 10,
                orderBy: { createdAt: 'asc' }
            });
        });

        it('should return paginated messages and total count', async () => {
            const conversationId = 1;
            const page = 1;
            const size = 10;
            const mockMessages = [mockRoomMessageData];
            const mockTotalCount = 1;

            jest.spyOn(mockPrismaService, '$transaction').mockResolvedValue([mockTotalCount, mockMessages]);
            jest.spyOn(mockPrismaService.messages, 'findMany').mockResolvedValue(mockMessages);
            jest.spyOn(mockPrismaService.messages, 'count').mockResolvedValue(mockTotalCount);

            const result = await service.getMessagesByRoomId(conversationId, page, size);

            expect(mockPrismaService.$transaction).toHaveBeenCalled();
            expect(result.total).toBe(mockTotalCount);
            expect(result.records).toEqual(mockMessages);
        });
    });

    describe('createMessage', () => {
        it('should create a message and return it', async () => {
            const userId = 1;
            const roomId = 1;
            const content = 'New message';
            const mockMessage = mockRoomMessageData;

            jest.spyOn(mockPrismaService.messages, 'create').mockResolvedValue(mockMessage);

            const result = await service.createMessage(userId, roomId, content);

            expect(mockPrismaService.messages.create).toHaveBeenCalledWith({
                data: {
                    userId,
                    roomId,
                    text: content
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            age: true,
                            avatar: true,
                            isOnline: true,
                            createdAt: true
                        }
                    }
                }
            });
            expect(result).toEqual(mockMessage);
        });
    });

    describe('updateMessagesReadStatus', () => {
        it('should update messages as read for the sender', async () => {
            const roomId = 1;
            const senderId = 1;

            // Mocking Prisma updateMany method
            jest.spyOn(mockPrismaService.messages, 'updateMany').mockResolvedValue({ count: 2 });

            await service.updateMessagesReadStatus(roomId, senderId);

            expect(mockPrismaService.messages.updateMany).toHaveBeenCalledWith({
                where: { roomId, userId: senderId },
                data: { isRead: true }
            });
        });
    });

    describe('getReceiverByRoomId', () => {
        it('should return the receiver user in the room', async () => {
            const roomId = 1;
            const currentUserId = 1;
            const mockReceiverUser = mockUserData;

            // Mocking Prisma findFirst method
            jest.spyOn(mockPrismaService.roomUsers, 'findFirst').mockResolvedValue({
                user: mockReceiverUser
            } as any);

            const result = await service.getReceiverByRoomId(roomId, currentUserId);

            expect(mockPrismaService.roomUsers.findFirst).toHaveBeenCalledWith({
                where: { roomId, userId: { not: currentUserId } },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            age: true,
                            avatar: true,
                            isOnline: true,
                            createdAt: true
                        }
                    }
                }
            });
            expect(result).toEqual(mockReceiverUser);
        });
    });

    it('should return the count of unread messages in the specified room not sent by the given user', async () => {
        const roomId = 1;
        const userId = 2;
        const unreadCount = 5;

        jest.spyOn(mockPrismaService.messages, 'count').mockResolvedValue(unreadCount);

        const result = await service.getUnreadMessagesByRoom(roomId, userId);

        expect(mockPrismaService.messages.count).toHaveBeenCalledWith({
            where: {
                roomId,
                userId: {
                    not: userId
                },
                isRead: false
            }
        });

        expect(result).toBe(unreadCount);
    });

    it('should return the room ID if both users are in the same room', async () => {
        const userId = 1;
        const receiverId = 2;
        const roomId = 100;

        (mockPrismaService.roomUsers.groupBy as jest.Mock).mockReturnValueOnce([{ roomId }]);

        jest.spyOn(mockPrismaService.rooms, 'findFirst').mockResolvedValue({
            id: roomId,
            createdAt: new Date()
        });

        const result = await service.getConversationByUserIds(userId, receiverId);

        expect(mockPrismaService.roomUsers.groupBy).toHaveBeenCalledWith({
            by: ['roomId'],
            where: {
                userId: {
                    in: [userId, receiverId]
                }
            },
            having: {
                roomId: {
                    _count: {
                        equals: 2
                    }
                }
            }
        });

        expect(mockPrismaService.rooms.findFirst).toHaveBeenCalledWith({
            where: { id: roomId },
            select: { id: true }
        });

        expect(result).toEqual({ roomId });
    });

    it('should return roomId 0 if no common room exists for both users', async () => {
        const userId = 1;
        const receiverId = 2;

        (mockPrismaService.roomUsers.groupBy as jest.Mock).mockReturnValueOnce([]);

        const result = await service.getConversationByUserIds(userId, receiverId);

        expect(mockPrismaService.roomUsers.groupBy).toHaveBeenCalledWith({
            by: ['roomId'],
            where: {
                userId: {
                    in: [userId, receiverId]
                }
            },
            having: {
                roomId: {
                    _count: {
                        equals: 2
                    }
                }
            }
        });

        expect(result).toEqual({ roomId: 0 });
    });

    describe('deleteConversationByRoomId', () => {
        it('should delete all messages, room users, and the room by roomId in a transaction', async () => {
            const roomId = 1;

            jest.spyOn(mockPrismaService, '$transaction').mockResolvedValue(undefined);
            jest.spyOn(mockPrismaService.messages, 'deleteMany').mockResolvedValue(null);
            jest.spyOn(mockPrismaService.roomUsers, 'deleteMany').mockResolvedValue(null);
            jest.spyOn(mockPrismaService.rooms, 'delete').mockResolvedValue(null);

            await service.deleteConversationByRoomId(roomId);

            expect(mockPrismaService.messages.deleteMany).toHaveBeenCalledWith({
                where: {
                    roomId
                }
            });

            expect(mockPrismaService.roomUsers.deleteMany).toHaveBeenCalledWith({
                where: {
                    roomId
                }
            });

            expect(mockPrismaService.rooms.delete).toHaveBeenCalledWith({
                where: {
                    id: roomId
                }
            });

            expect(mockPrismaService.$transaction).toHaveBeenCalledWith([
                expect.any(Promise),
                expect.any(Promise),
                expect.any(Promise)
            ]);
        });
    });

    describe('getConversationsByUserId', () => {
        it('should return conversations for the given user with latest message, user info, and unread message count', async () => {
            const userId = 1;
            const roomId = 1;
            const mockUser = mockUserData;
            const unreadMessagesCount = 2;

            const mockRoomsResult = [
                {
                    id: 1,
                    roomId: roomId,
                    room: {
                        messages: [mockReadMessageData]
                    },
                    userId: 1,
                    user: mockUser,
                    unreadMessagesCount
                }
            ];

            const expectedMockRooms = [
                {
                    id: 1,
                    roomId: roomId,
                    message: mockReadMessageData,
                    user: mockUser,
                    unreadMessagesCount
                }
            ];

            service['getUserByRoom'] = jest.fn().mockResolvedValue(mockUser);
            jest.spyOn(mockPrismaService.roomUsers, 'findMany').mockResolvedValue(mockRoomsResult);
            jest.spyOn(service, 'getUnreadMessagesByRoom').mockResolvedValue(unreadMessagesCount);

            const result = await service.getConversationsByUserId(userId);

            expect(result).toEqual(expectedMockRooms);

            // Verifying interactions
            expect(mockPrismaService.roomUsers.findMany).toHaveBeenCalledWith({
                where: {
                    userId,
                    room: {
                        messages: {
                            some: {}
                        }
                    }
                },
                include: {
                    room: {
                        include: {
                            messages: {
                                select: {
                                    id: true,
                                    text: true,
                                    isRead: true,
                                    createdAt: true
                                },
                                orderBy: {
                                    createdAt: 'desc'
                                },
                                take: 1
                            }
                        }
                    }
                }
            });

            expect(service.getUnreadMessagesByRoom).toHaveBeenCalledTimes(expectedMockRooms.length);
        });
    });
});
