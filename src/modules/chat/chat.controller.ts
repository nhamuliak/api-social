import { Response } from 'express';
import { BadRequestException, Body, Controller, Get, HttpStatus, Param, Post, Res, UseGuards } from '@nestjs/common';
import { AccessGuard } from '@core/guards/access/access.guard';
import { User } from '@core/decorators';
import { ChatService } from '@modules/chat/chat.service';

@UseGuards(AccessGuard)
@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    @Get('')
    public async getConversations(@User('id') userId: number, @Res() res: Response): Promise<Response<any[]>> {
        const conversations = await this.chatService.getConversationsByUserId(userId);

        return res.status(HttpStatus.OK).send(conversations);
    }

    @Get(':id/latest-conversations')
    public async getLatestConversations(
        @Param('id') paramId: number,
        @User('id') userId: number,
        @Res() res: Response
    ): Promise<Response<any[]>> {
        const id = Number(paramId);

        const conversation = await this.chatService.getConversationById(id);

        if (!conversation) {
            throw new BadRequestException('The conversation was not found');
        }

        const latestConversations = await this.chatService.getLatestConversations(id, userId);

        return res.status(HttpStatus.OK).send(latestConversations);
    }

    @Post('')
    public async createConversation(
        @User('id') userId: number,
        @Body() { receiverId }: { receiverId: number },
        @Res() res: Response
    ): Promise<Response<{ conversationId: number }>> {
        if (receiverId === userId) {
            throw new BadRequestException('Receiver user cannot be the sender');
        }

        const [conversation] = await this.chatService.getConversationByUserIds(userId, receiverId);

        console.log('conversation data: ', conversation);
        if (conversation) {
            console.log('if Conversation:', conversation);
            return res.status(HttpStatus.OK).send(conversation);
        }

        // Create a new conversation
        const conversationId = await this.chatService.createConversation(userId, receiverId);

        console.log('conversation ID: ', conversationId);

        return res.status(HttpStatus.OK).send({ roomId: conversationId });
    }

    @Get(':id/messages')
    public async getMessagesByConversationId(
        @Param('id') paramId: number,
        @Res() res: Response
    ): Promise<Response<any[]>> {
        const id = Number(paramId);

        const conversation = await this.chatService.getConversationById(id);

        if (!conversation) {
            throw new BadRequestException('The conversation was not found');
        }

        const conversations = await this.chatService.getMessagesByRoomId(id);

        return res.status(HttpStatus.OK).send(conversations);
    }

    @Post('messages')
    public async createMessage(
        @User('id') userId: number,
        @Body() { roomId, content }: any,
        @Res() res: Response
    ): Promise<Response<any>> {
        const conversation = await this.chatService.getConversationById(roomId);

        if (!conversation) {
            throw new BadRequestException('The conversation was not found');
        }

        const message = await this.chatService.createMessage(userId, roomId, content);

        return res.status(HttpStatus.OK).send(message);
    }

    @Get(':id/receiver')
    public async getReceiverByRoomId(
        @User('id') userId: number,
        @Param('id') roomId: number,
        @Res() res: Response
    ): Promise<Response<any>> {
        const receiver = await this.chatService.getReceiverByRoomId(+roomId, +userId);

        return res.status(HttpStatus.OK).send(receiver);
    }
}
