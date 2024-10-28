import { Response } from 'express';
import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { AccessGuard } from '@core/guards/access/access.guard';
import { User } from '@core/decorators';
import { ChatService } from '@modules/chat/chat.service';
import { ChatGateway } from '@modules/chat/chat.gateway';
import { PaginationModel } from '@models/pagination.model';
import { ConversationPrismaModel, MessagePrismaModel } from '@business/models/chat-prisma.model';
import { UserPrismaModel } from '@business/models';

@UseGuards(AccessGuard)
@Controller('chat')
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
        private readonly chatGateway: ChatGateway
    ) {}

    @Get('')
    public async getConversations(
        @User('id') userId: number,
        @Res() res: Response
    ): Promise<Response<ConversationPrismaModel[]>> {
        const conversations = await this.chatService.getConversationsByUserId(userId);

        return res.status(HttpStatus.OK).send(conversations);
    }

    @Get(':id/latest-conversations')
    public async getLatestConversations(
        @Param('id') id: number,
        @User('id') userId: number,
        @Res() res: Response
    ): Promise<Response<ConversationPrismaModel[]>> {
        const latestConversations = await this.chatService.getLatestConversations(+id, userId);

        return res.status(HttpStatus.OK).send(latestConversations);
    }

    @Post('')
    public async createConversation(
        @User('id') userId: number,
        @Body() { receiverId }: { receiverId: number },
        @Res() res: Response
    ): Promise<Response<{ conversationId: number }>> {
        const conversationId = await this.chatService.createConversation(userId, receiverId, res);

        return res.status(HttpStatus.OK).send({ roomId: conversationId });
    }

    @Delete(':id')
    public async deleteConversationByRoomId(
        @Param('id') roomId: number,
        @Body() { receiverId }: { receiverId: number },
        @Res() res: Response
    ): Promise<Response<void>> {
        await this.chatService.deleteConversationByRoomId(+roomId);

        this.chatGateway.notifyRoomDeleted(+roomId, +receiverId);

        return res.status(HttpStatus.NO_CONTENT).send();
    }

    @Get(':id/messages')
    public async getMessagesByConversationId(
        @Param('id') id: number,
        @Query() { page, size }: { page: number; size: number },
        @Res() res: Response
    ): Promise<Response<PaginationModel<MessagePrismaModel>>> {
        const result = await this.chatService.getMessagesByConversationId(+id, +page, +size);

        return res.status(HttpStatus.OK).send(result);
    }

    @Post('messages')
    public async createMessage(
        @User('id') userId: number,
        @Body() { roomId, receiverId, content }: any,
        @Res() res: Response
    ): Promise<Response<MessagePrismaModel>> {
        const message = await this.chatService.sendMessage(roomId, userId, receiverId, content);

        this.chatGateway.notifyCreatedMessage(receiverId, message);

        return res.status(HttpStatus.OK).send(message);
    }

    @Get(':id/receiver')
    public async getReceiverByRoomId(
        @User('id') userId: number,
        @Param('id') roomId: number,
        @Res() res: Response
    ): Promise<Response<UserPrismaModel>> {
        const receiver = await this.chatService.getReceiverByRoomId(+roomId, +userId);

        return res.status(HttpStatus.OK).send(receiver);
    }
}
