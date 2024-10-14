import { Injectable } from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';

@Injectable()
export class ChatService {
    constructor(private readonly prismaService: PrismaService) {}

    public async getConversationById(id: number): Promise<any> {
        return this.prismaService.rooms.findUnique({
            where: {
                id: id
            }
        });
    }

    public async getConversationsByUserId(userId: number): Promise<any[]> {
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
                const room = await this.getUserByRoom(data.roomId, userId);

                return {
                    id: data.id,
                    roomId: data.roomId,
                    message: data.room.messages[0],
                    user: room.user
                };
            })
        );
    }

    public async getConversationByUserId(userId: number): Promise<any> {
        return this.prismaService.roomUsers.findFirst({
            where: {
                userId
            }
        });
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

    public async getMessagesByRoomId(conversationId: number): Promise<any> {
        return this.prismaService.messages.findMany({
            where: {
                roomId: conversationId
            },
            include: {
                user: {
                    select: this.userMapping
                }
            }
        });
    }

    public async createMessage(userId: number, roomId: number, content: string): Promise<any> {
        return this.prismaService.messages.create({
            data: {
                userId,
                roomId,
                text: content
            },
            include: {
                user: {
                    select: this.userMapping
                }
            }
        });
    }

    public async getReceiverByRoomId(roomId: number, currentUserId: number): Promise<any> {
        const result = await this.prismaService.roomUsers.findFirst({
            where: {
                roomId: roomId,
                userId: {
                    not: currentUserId
                }
            },
            include: {
                user: {
                    select: this.userMapping
                }
            }
        });

        return result.user;
    }

    // Private Methods

    private async getUserByRoom(roomId: number, userId: number): Promise<any> {
        return this.prismaService.roomUsers.findFirst({
            where: {
                roomId: roomId,
                userId: {
                    not: userId
                }
            },
            include: {
                user: {
                    select: this.userMapping
                }
            }
        });
    }

    private get userMapping(): { [key: string]: boolean } {
        return {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            isOnline: true,
            createdAt: true
        };
    }
}
