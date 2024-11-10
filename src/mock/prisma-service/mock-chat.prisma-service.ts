export class MockChatPrismaService {
    public getConversationsByUserId = jest.fn();
    public getConversationById = jest.fn();
    public getMessagesByRoomId = jest.fn();
    public getConversationByUserIds = jest.fn();
    public createConversation = jest.fn();
    public deleteConversationByRoomId = jest.fn();
    public createMessage = jest.fn();
    public getUnreadMessagesByRoom = jest.fn();
    public updateMessagesReadStatus = jest.fn();
    public getReceiverByRoomId = jest.fn();
    public getLatestConversations = jest.fn();
}
