import { UserPrismaModel } from '@business/models/user-prisma.model';

export interface ConversationPrismaModel {
    id: number;
    roomId: number;
    message: ConversationMessagePrismaModel;
    user: UserPrismaModel;
    unreadMessagesCount: number;
}

export interface ConversationMessagePrismaModel {
    id: number;
    roomId: number;
    text: string;
    isRead: boolean;
    createdAt: Date | string;
}

export interface MessagePrismaModel extends ConversationMessagePrismaModel {
    user: UserPrismaModel;
}
