import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketServer
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { verifyToken } from '@utils/helper';
import { UnauthorizedException } from '@nestjs/common';
import { UserPrismaService } from '@business/services/user-prisma/user-prisma.service';
import { ChatService } from '@modules/chat/chat.service';
import { ConversationPrismaModel } from '@business/models/chat-prisma.model';

const userSocketMap = new Map();

@WebSocketGateway({ namespace: 'chat', cors: { origin: true } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    private server: Server;

    constructor(
        private readonly chatService: ChatService,
        private readonly userPrismaService: UserPrismaService
    ) {}

    public async handleConnection(socket: Socket): Promise<void> {
        try {
            const payload = await verifyToken(socket.handshake.headers.authorization);
            const user = await this.userPrismaService.getUserById(payload.id);

            if (!user) this.disconnect(socket);

            socket.data.userId = user.id;
            userSocketMap.set(user.id, socket.id);

            await this.userPrismaService.updateUserOnlineStatusById(user.id, true);

            this.server.emit('online-users', Array.from(userSocketMap.keys()));
        } catch {
            this.disconnect(socket);
        }
    }

    public async handleDisconnect(socket: Socket): Promise<void> {
        if (socket.data.userId) {
            await this.userPrismaService.updateUserOnlineStatusById(socket.data.userId, false);
        }
        userSocketMap.delete(socket.data.userId);

        this.server.emit('online-users', Array.from(userSocketMap.keys()));
    }

    @SubscribeMessage('get-online-users')
    public handleGetOnlineUsers(@ConnectedSocket() socket: Socket) {
        socket.emit('online-users', Array.from(userSocketMap.keys()));
    }

    @SubscribeMessage('mark-messages-as-read')
    public async handleUnreadMessages(
        @MessageBody() { roomId, senderId }: { roomId: number; senderId: number }
    ): Promise<void> {
        await this.chatService.updateMessagesReadStatus(roomId, senderId);
    }

    public notifyCreatedMessage(receiverId: number, conversation: ConversationPrismaModel): void {
        const receiverSocketId = userSocketMap.get(receiverId);

        this.server.to(receiverSocketId).emit('message', conversation.message);
        this.server.to(receiverSocketId).emit('last-messages', conversation);
    }

    public notifyRoomDeleted(roomId: number, receiverId: number): void {
        const receiverSocketId = userSocketMap.get(receiverId);

        this.server.to(receiverSocketId).emit('room-was-deleted', roomId);
    }

    private disconnect(socket: Socket): void {
        socket.emit('error', new UnauthorizedException());

        socket.disconnect();
    }
}
