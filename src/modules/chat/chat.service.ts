import { Injectable } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';

@Injectable()
export class ChatService {
    constructor(private readonly prismaService: PrismaService) {}

    public createRoom(user1Id: number, user2Id: number): Promise<any> {
        return this.prismaService.$transaction(async prisma => {
            const room = await prisma.rooms.create({ data: {} });

            await prisma.roomUsers.createMany({
                data: [
                    { roomId: room.id, userId: user1Id },
                    { roomId: room.id, userId: user2Id }
                ],
                skipDuplicates: true // This will ignore duplicates if the relationship already exists
            });

            return room;
        });
    }

    public getRoomsByUserId(userId: number): Promise<any[]> {
        // return this.prismaService.$queryRaw`
        //     SELECT * FROM roomUsers WHERE userId = ${userId}
        // `;

        return this.prismaService.roomUsers.findMany({
            where: {
                userId: userId
            },
            include: {
                room: {
                    select: {
                        messages: {
                            take: 1,
                            orderBy: { createdAt: 'desc' }
                        }
                    }
                }
            }
        });

        // const rooms = await this.prismaService.$queryRaw`
        //     SELECT
        //       r.id AS roomId,
        //       r.createdAt AS roomCreatedAt,
        //       m.id AS messageId,
        //       m.text AS messageText,
        //       m.createdAt AS messageCreatedAt,
        //       u.id AS userId,
        //       u.username AS userUsername
        //     FROM
        //       Rooms r
        //     JOIN
        //       RoomUsers ru ON r.id = ru.roomId
        //     LEFT JOIN
        //       Messages m ON r.id = m.roomId
        //     LEFT JOIN
        //       Users u ON m.userId = u.id
        //     WHERE
        //       ru.userId = ${userId}
        //       AND m.id = (
        //         SELECT id
        //         FROM Messages
        //         WHERE roomId = r.id
        //         ORDER BY createdAt DESC
        //         LIMIT 1
        //       )
        //     ORDER BY
        //       r.createdAt DESC;
        //   `;
    }

    public getMessagesByRoomId(roomId: number): Promise<any[]> {
        // return this.prismaService.$queryRaw`
        //     SELECT * FROM messages
        //     WHERE roomId = ${roomId}
        //     ORDER BY created_at ASC
        // `;

        return this.prismaService.messages.findMany({
            where: {
                roomId: roomId
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    public saveMessage(userId: number, roomId: number, message: string): Promise<any> {
        // return this.prismaService.$queryRaw`
        //     INSERT INTO messages (user_id, room_id, text) VALUES (${userId}, ${roomId}, ${message}) RETURNING *
        // `;
        return this.prismaService.messages.create({
            data: {
                userId,
                roomId,
                text: message
            }
        });
    }

    public updateMessageReadStatus(messageId: number): Promise<any> {
        return this.prismaService.messages.update({
            where: {
                id: messageId
            },
            data: {
                isRead: true
            }
        });
    }

    // public async create(createChatDto: CreateChatDto): Promise<void> {
    //     await this.prismaService.messages.create({
    //         data: {
    //             text: createChatDto.text,
    //             conversationId: createChatDto.conversationId,
    //             userId: createChatDto.userId
    //         }
    //     });
    // }
    //
    // public async findAll(conversationId: number) {
    //     await this.prismaService.conversations.findFirst({
    //         where: {
    //             id: conversationId
    //         },
    //         select: {
    //             messages: true
    //         }
    //     });
    // }
}
