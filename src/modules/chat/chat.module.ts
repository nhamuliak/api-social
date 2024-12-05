import { Module } from '@nestjs/common';
import { ChatService } from './services/chat.service';
import { ChatGateway } from './gateways/chat.gateway';
import { ChatController } from './controllers/chat.controller';

@Module({
    providers: [ChatGateway, ChatService],
    controllers: [ChatController]
})
export class ChatModule {}
