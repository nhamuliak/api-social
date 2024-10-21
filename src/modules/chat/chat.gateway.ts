import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketServer
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
// import { CreateChatDto } from './dto/create-chat.dto';
// import { UpdateChatDto } from './dto/update-chat.dto';
import { Socket, Server } from 'socket.io';
import { verifyToken } from '@utils/helper';
import { UserService } from '@modules/user/user.service';
import { BadRequestException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { User } from '@core/decorators';

// class CreateRoomDto {
//     user1Id: number;
//     user2Id: number;
// }
//
// class NewMessageDto {
//     userId: number;
//     roomId: number;
//     message: string;
// }

const userSocketMap = new Map();

@WebSocketGateway({ namespace: 'chat', cors: { origin: true } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly chatService: ChatService,
        private readonly userService: UserService
    ) {}

    public async handleConnection(socket: Socket): Promise<void> {
        try {
            const payload = await verifyToken(socket.handshake.headers.authorization);
            const user = await this.userService.getUserById(payload.id);

            if (!user) this.disconnect(socket);

            socket.data.userId = user.id;
            userSocketMap.set(user.id, socket.id);

            await this.userService.updateUserOnlineStatusById(user.id, true);

            this.server.emit('online-users', Array.from(userSocketMap.keys()));
            console.log('user is connected... ', user.id, socket.id);
        } catch {
            this.disconnect(socket);
        }
    }

    public async handleDisconnect(socket: Socket): Promise<void> {
        if (socket.data.userId) {
            await this.userService.updateUserOnlineStatusById(socket.data.userId, false);
        }
        userSocketMap.delete(socket.data.userId);

        this.server.emit('online-users', Array.from(userSocketMap.keys()));
    }

    @SubscribeMessage('get-online-users')
    public handleGetOnlineUsers(@ConnectedSocket() socket: Socket) {
        socket.emit('online-users', Array.from(userSocketMap.keys()));
    }

    @SubscribeMessage('join-room')
    public async handleGetMessages(@MessageBody() roomId: number, @ConnectedSocket() socket: Socket) {
        const conversation = await this.chatService.getConversationById(roomId);

        if (!conversation) {
            throw new BadRequestException('The conversation was not found');
        }

        const messages = await this.chatService.getMessagesByRoomId(roomId);

        this.server.to(socket.id).emit('messages', messages);
    }

    @SubscribeMessage('send-message')
    public async handleCreateMessage(
        @MessageBody() { roomId, receiverId, content }: { roomId: number; receiverId: number; content: string },
        @ConnectedSocket() socket: Socket
    ): Promise<void> {
        const conversation = await this.chatService.getConversationById(roomId);

        if (!conversation) {
            throw new BadRequestException('The conversation was not found');
        }

        const message = await this.chatService.createMessage(socket.data.userId, roomId, content);

        const unreadMessageCount = await this.chatService.getUnreadMessagesByRoom(roomId, receiverId);

        const receiverSocketId = userSocketMap.get(receiverId);

        this.server.to(receiverSocketId).to(socket.id).emit('message', message);
        this.server.to(receiverSocketId).to(socket.id).emit('last-messages', { message, unreadMessageCount });
    }

    @SubscribeMessage('mark-as-read-messages')
    public async handleUnreadMessages(
        @MessageBody() { roomId, senderId }: { roomId: number; senderId: number },
        @ConnectedSocket() socket: Socket
    ): Promise<void> {
        // TODO:: check if room and user exists

        await this.chatService.updateMessagesReadStatus(roomId, senderId);

        this.server.to(socket.id).emit('checked-messages');
    }

    // TODO:: uncommit it earlier
    // @SubscribeMessage('emit-rooms')
    // public async handleEmitRooms(@ConnectedSocket() socket: Socket): Promise<void> {
    //     const conversations = await this.chatService.getConversationsByUserId(socket.data.userId);
    //
    //     this.server.to(socket.id).emit('rooms', conversations);
    // }
    //
    // @SubscribeMessage('create-room')
    // public async handleCreateRoom(@MessageBody() receiverId: number, @ConnectedSocket() socket: Socket): Promise<void> {
    //     const userId = socket.data.userId;
    //
    //     if (receiverId === userId) {
    //         throw new BadRequestException('Receiver user cannot be the sender');
    //     }
    //
    //     const [conversation] = await this.chatService.getConversationByUserIds(userId, receiverId);
    //
    //     if (conversation) {
    //         this.server.to(socket.id).emit('room', conversation);
    //     }
    //
    //     // Create a new conversation
    //     const conversationId = await this.chatService.createConversation(userId, receiverId);
    //
    //     this.server.to(socket.id).emit('room', { roomId: conversationId });
    // }

    // @SubscribeMessage('createRoom')
    // public async handleCreateRoom(
    //     @MessageBody() { user1Id, user2Id }: CreateRoomDto,
    //     @ConnectedSocket() socket: Socket
    // ): Promise<void> {
    //     const room = await this.chatService.createRoom(+user1Id, +user2Id);
    //
    //     socket.emit('createRoom', room);
    // }
    //
    // @SubscribeMessage('getRoomByUserId')
    // public async handleGetRoomByUserId(
    //     @MessageBody() userId: string,
    //     @ConnectedSocket() socket: Socket
    // ): Promise<void> {
    //     const rooms = await this.chatService.getRoomsByUserId(+userId);
    //
    //     socket.emit('getRooms', rooms);
    // }
    //
    // @SubscribeMessage('getMessagesByRoomId')
    // public async handleGetMessagesByRoomId(
    //     @MessageBody() roomId: number,
    //     @ConnectedSocket() socket: Socket
    // ): Promise<void> {
    //     const messages = await this.chatService.getMessagesByRoomId(+roomId);
    //
    //     console.log('messages: ', messages);
    //     socket.emit('getMessages', messages);
    // }
    //
    // @SubscribeMessage('newMessage')
    // public async handleNewMessage(
    //     @MessageBody() { userId, roomId, message }: NewMessageDto,
    //     @ConnectedSocket() socket: Socket
    // ): Promise<void> {
    //     const newMessage = await this.chatService.saveMessage(+userId, +roomId, message);
    //     console.log('from event "message": ', newMessage);
    //
    //     socket.to(roomId.toString()).emit('newMessage', newMessage);
    // }
    //
    // @SubscribeMessage('messageRead')
    // public async handleMessageRead(@MessageBody() messageId: number, @ConnectedSocket() socket: Socket): Promise<void> {
    //     const message = await this.chatService.updateMessageReadStatus(messageId);
    //
    //     socket.to(message.roomId).emit('messageRead', message);
    // }

    // @SubscribeMessage('createChat')
    // create(@MessageBody() createChatDto: CreateChatDto) {
    //     return this.chatService.create(createChatDto);
    // }
    //
    // @SubscribeMessage('findAllChat')
    // findAll() {
    //     return this.chatService.findAll(1);
    // }
    //
    // @SubscribeMessage('findOneChat')
    // findOne(@MessageBody() id: number) {
    //     return this.chatService.findOne(id);
    // }
    //
    // @SubscribeMessage('updateChat')
    // update(@MessageBody() updateChatDto: UpdateChatDto) {
    //     return this.chatService.update(updateChatDto.id, updateChatDto);
    // }
    //
    // @SubscribeMessage('removeChat')
    // remove(@MessageBody() id: number) {
    //     return this.chatService.remove(id);
    // }

    private disconnect(socket: Socket) {
        socket.emit('error', new UnauthorizedException());

        socket.disconnect();
    }
}
