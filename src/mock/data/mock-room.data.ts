import { mockMessageListData } from '@mock/data/mock-chat.data';

export const mockRoomData = {
    id: 1,
    roomId: 1,
    room: {
        messages: mockMessageListData
    },
    userId: 1,
    createdAt: new Date()
};

export const mockRoomListData = [mockRoomData];

export const mockRoomMessageData = {
    id: 1,
    roomId: 1,
    text: 'Some text',
    isRead: true,
    createdAt: new Date(),
    userId: 1
};
