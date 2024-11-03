import { Response } from 'express';
import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { AccessGuard } from '@core/guards/access/access.guard';
import { User } from '@core/decorators';
import { ChatService } from '@modules/chat/chat.service';
import { ChatGateway } from '@modules/chat/chat.gateway';
import { PaginationModel } from '@models/pagination.model';
import { ConversationPrismaModel, MessagePrismaModel } from '@business/models/chat-prisma.model';
import { UserPrismaModel } from '@business/models';
import { MessageDto } from '@modules/chat/dto/message.dto';

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
        const result = await this.chatService.checkIfConversationExists(userId, receiverId);

        if (result.roomId) {
            return res.status(HttpStatus.OK).send(result);
        }

        const conversationId = await this.chatService.createConversation(userId, receiverId);

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

    @Post('message')
    public async createMessage(
        @User('id') userId: number,
        @Body() { roomId, receiverId, content }: MessageDto,
        @Res() res: Response
    ): Promise<Response<MessagePrismaModel>> {
        const conversation = await this.chatService.sendMessage(roomId, userId, receiverId, content);

        this.chatGateway.notifyCreatedMessage(receiverId, conversation);

        return res.status(HttpStatus.OK).send({ ...conversation.message, user: conversation.user });
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
