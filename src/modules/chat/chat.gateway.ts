import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { ChatService } from './chat.service';
// import { CreateChatDto } from './dto/create-chat.dto';
// import { UpdateChatDto } from './dto/update-chat.dto';
import { Socket } from 'socket.io';

class CreateRoomDto {
    user1Id: number;
    user2Id: number;
}

class NewMessageDto {
    userId: number;
    roomId: number;
    message: string;
}

@WebSocketGateway()
export class ChatGateway {
    constructor(private readonly chatService: ChatService) {}

    @SubscribeMessage('createRoom')
    public async handleCreateRoom(
        @MessageBody() { user1Id, user2Id }: CreateRoomDto,
        @ConnectedSocket() socket: Socket
    ): Promise<void> {
        const room = await this.chatService.createRoom(+user1Id, +user2Id);

        socket.emit('createRoom', room);
    }

    @SubscribeMessage('getRoomByUserId')
    public async handleGetRoomByUserId(
        @MessageBody() userId: string,
        @ConnectedSocket() socket: Socket
    ): Promise<void> {
        const rooms = await this.chatService.getRoomsByUserId(+userId);

        socket.emit('getRooms', rooms);
    }

    @SubscribeMessage('getMessagesByRoomId')
    public async handleGetMessagesByRoomId(
        @MessageBody() roomId: number,
        @ConnectedSocket() socket: Socket
    ): Promise<void> {
        const messages = await this.chatService.getMessagesByRoomId(+roomId);

        console.log('messages: ', messages);
        socket.emit('getMessages', messages);
    }

    @SubscribeMessage('newMessage')
    public async handleNewMessage(
        @MessageBody() { userId, roomId, message }: NewMessageDto,
        @ConnectedSocket() socket: Socket
    ): Promise<void> {
        const newMessage = await this.chatService.saveMessage(+userId, +roomId, message);
        console.log('from event "message": ', newMessage);

        socket.to(roomId.toString()).emit('newMessage', newMessage);
    }

    @SubscribeMessage('messageRead')
    public async handleMessageRead(@MessageBody() messageId: number, @ConnectedSocket() socket: Socket): Promise<void> {
        const message = await this.chatService.updateMessageReadStatus(messageId);

        socket.to(message.roomId).emit('messageRead', message);
    }

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
}
