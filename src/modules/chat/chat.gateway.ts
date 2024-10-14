import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
// import { CreateChatDto } from './dto/create-chat.dto';
// import { UpdateChatDto } from './dto/update-chat.dto';
import { Socket } from 'socket.io';
import { verifyToken } from '@utils/helper';
import { UserService } from '@modules/user/user.service';
import { UnauthorizedException } from '@nestjs/common';

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

const messages = [];

const userSocketMap = new Map();

@WebSocketGateway({ cors: { origin: true } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        private readonly chatService: ChatService,
        private readonly userService: UserService
    ) {}

    public async handleConnection(socket: Socket): Promise<void> {
        try {
            const payload = await verifyToken(socket.handshake.headers.authorization);
            const user = await this.userService.getUserById(payload.id);

            if (!user) this.disconnect(socket);

            userSocketMap.set(user.id, socket.id);
            // get rooms by userId
        } catch {
            this.disconnect(socket);
        }
    }

    public async handleDisconnect(): Promise<void> {}

    @SubscribeMessage('send-message')
    public handleMessage(@MessageBody() data: { userId: number; message: string }, @ConnectedSocket() socket: Socket) {
        // console.log('message: ', data);
        messages.push(data);

        socket.emit('message', data.message);
    }

    @SubscribeMessage('get-messages')
    public handleGetMessages(@ConnectedSocket() socket: Socket) {
        // get array of data from DB...

        socket.emit('messages', messages);
    }

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

        // userSocketMap.delete();
        socket.disconnect();
    }
}
