import { BadRequestException, Injectable } from '@nestjs/common';
import { ChatPrismaService } from '@business/services/chat-prisma/chat-prisma.service';
import { ConversationPrismaModel, MessagePrismaModel } from '@business/models/chat-prisma.model';
import { UserPrismaService } from '@business/services/user-prisma/user-prisma.service';
import { PaginationModel } from '@models/pagination.model';
import { UserPrismaModel } from '@business/models';

@Injectable()
export class ChatService {
    constructor(
        private readonly chatPrismaService: ChatPrismaService,
        private readonly userPrismaService: UserPrismaService
    ) {}

    public async getConversationsByUserId(userId: number): Promise<ConversationPrismaModel | unknown> {
        return this.chatPrismaService.getConversationsByUserId(userId);
    }

    public async getLatestConversations(id: number, userId: number): Promise<ConversationPrismaModel | unknown> {
        const conversation = await this.chatPrismaService.getConversationById(id);

        if (!conversation) {
            throw new BadRequestException('The conversation was not found');
        }

        return this.chatPrismaService.getLatestConversations(id, userId);
    }

    public async checkIfConversationExists(userId: number, receiverId: number): Promise<{ roomId: number }> {
        if (receiverId === userId) {
            throw new BadRequestException('Receiver user cannot be the sender');
        }

        return this.chatPrismaService.getConversationByUserIds(userId, receiverId);
    }

    public async createConversation(userId: number, receiverId: number): Promise<number> {
        return await this.chatPrismaService.createConversation(userId, receiverId);
    }

    public async deleteConversationByRoomId(roomId: number): Promise<void> {
        const room = await this.chatPrismaService.getConversationById(roomId);

        if (!room) {
            throw new BadRequestException('The conversation was not found');
        }

        await this.chatPrismaService.deleteConversationByRoomId(roomId);
    }

    public async getMessagesByConversationId(
        id: number,
        page: number,
        size: number
    ): Promise<PaginationModel<MessagePrismaModel>> {
        const conversation = await this.chatPrismaService.getConversationById(id);

        if (!conversation) {
            throw new BadRequestException('The conversation was not found');
        }

        const result = await this.chatPrismaService.getMessagesByRoomId(id, page, size);

        return result;
    }

    public async sendMessage(
        roomId: number,
        senderId: number,
        receiverId: number,
        content: string
    ): Promise<ConversationPrismaModel> {
        const conversationId = await this.chatPrismaService.getConversationById(roomId);

        if (!conversationId) {
            throw new BadRequestException('The conversation was not found');
        }

        const sender = await this.userPrismaService.getUserById(senderId);

        if (!sender) {
            throw new BadRequestException('The sender was not found');
        }

        const message = await this.chatPrismaService.createMessage(senderId, roomId, content);
        const unreadMessagesCount = await this.chatPrismaService.getUnreadMessagesByRoom(roomId, receiverId);

        return {
            id: conversationId,
            roomId,
            message,
            user: sender,
            unreadMessagesCount
        };
    }

    public async updateMessagesReadStatus(roomId: number, senderId: number): Promise<void> {
        const sender = await this.userPrismaService.getUserById(senderId);

        if (!sender) {
            throw new BadRequestException('The sender was not found');
        }

        const room = await this.chatPrismaService.getConversationById(roomId);

        if (!room) {
            throw new BadRequestException('The room was not found');
        }

        await this.chatPrismaService.updateMessagesReadStatus(roomId, senderId);
    }

    public async getReceiverByRoomId(roomId: number, userId: number): Promise<UserPrismaModel> {
        const conversationId = await this.chatPrismaService.getConversationById(roomId);

        if (!conversationId) {
            throw new BadRequestException('The conversation was not found');
        }

        const receiver = await this.chatPrismaService.getReceiverByRoomId(roomId, userId);

        if (!receiver) {
            throw new BadRequestException('The receiver was not found');
        }

        return receiver;
    }
}
