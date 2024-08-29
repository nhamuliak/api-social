import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { ChatService } from './chat.service';
// import { CreateChatDto } from './dto/create-chat.dto';
// import { UpdateChatDto } from './dto/update-chat.dto';
import { Socket } from 'socket.io';

@WebSocketGateway()
export class ChatGateway {
    // @WebSocketServer
    // private server: Serv;

    constructor(private readonly chatService: ChatService) {}

    @SubscribeMessage('event')
    handleEvent(@MessageBody() text: string): string {
        console.log('event: ', text);
        return `from event:  ${text}`;
    }

    @SubscribeMessage('message')
    handleMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
        console.log('from event "message": ', data);
        // return `from message:  ${text}`;
        client.to(data.roomId).emit(data.message);
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
