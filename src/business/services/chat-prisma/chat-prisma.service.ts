import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { PaginationModel, UserPrismaModel } from '@business/models';
import { ConversationPrismaModel, MessagePrismaModel } from '@business/models/chat-prisma.model';

@Injectable()
export class ChatPrismaService {
    constructor(private readonly prismaService: PrismaService) {}

    public async getConversationById(id: number): Promise<number> {
        const result = await this.prismaService.rooms.findUnique({
            where: {
                id: id
            },
            select: {
                id: true
            }
        });

        return result.id;
    }

    public async getLatestConversations(roomId: number, userId: number): Promise<ConversationPrismaModel[] | unknown> {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const result = await this.prismaService.roomUsers.findMany({
            where: {
                userId: userId,
                OR: [
                    {
                        roomId
                    },
                    {
                        room: {
                            // filter: show rooms only where there is at least one message
                            messages: {
                                some: {
                                    createdAt: {
                                        gte: weekAgo
                                    }
                                }
                            }
                        }
                    }
                ]
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
            // Pagination
            // take: 10,
            // skip: 1
        });

        // mapping data for response
        return Promise.all(
            result.map(async data => {
                const user = await this.getUserByRoom(data.roomId, userId);
                const unreadMessagesCount = await this.getUnreadMessagesByRoom(data.roomId, userId);

                return {
                    id: data.id,
                    roomId: data.roomId,
                    message: data.room.messages[0] || {},
                    user: user,
                    unreadMessagesCount
                };
            })
        );
    }

    public async getConversationsByUserId(userId: number): Promise<ConversationPrismaModel | unknown> {
        const result = await this.prismaService.roomUsers.findMany({
            where: {
                userId,
                room: {
                    // filter: show rooms only where there is at least one message
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

        // mapping data for response
        return Promise.all(
            result.map(async data => {
                const user = await this.getUserByRoom(data.roomId, userId);
                const unreadMessagesCount = await this.getUnreadMessagesByRoom(data.roomId, userId);

                return {
                    id: data.id,
                    roomId: data.roomId,
                    message: data.room.messages[0],
                    user: user,
                    unreadMessagesCount
                };
            })
        );
    }

    public async getConversationByUserIds(userId: number, receiverId: number): Promise<{ roomId: number }> {
        const groupedRooms = await this.prismaService.roomUsers.groupBy({
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

        if (groupedRooms.length === 0) {
            return { roomId: 0 };
        }

        const result = await this.prismaService.rooms.findFirst({
            where: {
                id: groupedRooms[0].roomId
            },
            select: {
                id: true
            }
        });

        return { roomId: result.id };
    }

    public async createConversation(senderId: number, receiverId: number): Promise<number> {
        const { id: conversationId } = await this.prismaService.rooms.create({
            data: {},
            select: { id: true }
        });

        await this.prismaService.roomUsers.createMany({
            data: [
                {
                    roomId: conversationId,
                    userId: senderId
                },
                {
                    roomId: conversationId,
                    userId: receiverId
                }
            ]
        });

        return conversationId;
    }

    public async deleteConversationByRoomId(roomId: number): Promise<void> {
        await this.prismaService.$transaction([
            this.prismaService.messages.deleteMany({
                where: {
                    roomId
                }
            }),
            this.prismaService.roomUsers.deleteMany({
                where: {
                    roomId: roomId
                }
            }),
            this.prismaService.rooms.delete({
                where: {
                    id: roomId
                }
            })
        ]);
    }

    public async getMessagesByRoomId(
        conversationId: number,
        page: number,
        size: number
    ): Promise<PaginationModel<MessagePrismaModel>> {
        const offset = (page - 1) * size;

        const result = await this.prismaService.$transaction([
            this.prismaService.messages.count({
                where: {
                    roomId: conversationId
                }
            }),
            this.prismaService.messages.findMany({
                where: {
                    roomId: conversationId
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
                },
                skip: offset,
                take: size,
                orderBy: {
                    createdAt: 'asc'
                }
            })
        ]);

        return {
            total: result[0],
            records: result[1]
        };
    }

    public async createMessage(userId: number, roomId: number, content: string): Promise<MessagePrismaModel> {
        return this.prismaService.messages.create({
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
    }

    public async updateMessagesReadStatus(roomId: number, senderId: number): Promise<void> {
        await this.prismaService.messages.updateMany({
            where: {
                roomId,
                userId: senderId
            },
            data: {
                isRead: true
            }
        });
    }

    public async getReceiverByRoomId(roomId: number, currentUserId: number): Promise<UserPrismaModel> {
        const result = await this.prismaService.roomUsers.findFirst({
            where: {
                roomId: roomId,
                userId: {
                    not: currentUserId
                }
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

        return result.user;
    }

    // Private Methods

    private async getUserByRoom(roomId: number, userId: number): Promise<UserPrismaModel | unknown> {
        const result = await this.prismaService.roomUsers.findFirst({
            where: {
                roomId: roomId,
                userId: {
                    not: userId
                }
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

        return result?.user;
    }

    public async getUnreadMessagesByRoom(roomId: number, userId: number): Promise<number> {
        return this.prismaService.messages.count({
            where: {
                roomId: roomId,
                userId: {
                    not: userId
                },
                isRead: false
            }
        });
    }
}
