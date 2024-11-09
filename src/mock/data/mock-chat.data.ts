import { mockUserData } from '@mock/data/mock-user.data';

export const mockReadMessageData = {
    id: 1,
    roomId: 1,
    text: 'Some text',
    isRead: true,
    createdAt: new Date(),
    user: mockUserData
};

export const mockUnReadMessageData = {
    id: 2,
    roomId: 1,
    text: 'The text was not read',
    isRead: false,
    createdAt: new Date(),
    user: mockUserData
};

export const mockMessageListData = [mockReadMessageData, mockUnReadMessageData];

export const mockConversationMessageData = {
    id: 1,
    roomId: 1,
    text: 'Last message',
    isRead: true,
    createdAt: new Date()
};

export const mockConversationData = {
    id: 1,
    roomId: 1,
    message: mockConversationMessageData,
    user: mockUserData,
    unreadMessagesCount: 0
};

export const mockConversationListData = [mockConversationData];

export const mockCreateMessageData = { roomId: 1, receiverId: 2, content: 'Hello' };
