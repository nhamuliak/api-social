export class MockChatService {
    getConversationsByUserId = jest.fn();
    getLatestConversations = jest.fn();
    checkIfConversationExists = jest.fn();
    createConversation = jest.fn();
    deleteConversationByRoomId = jest.fn();
    getMessagesByConversationId = jest.fn();
    sendMessage = jest.fn();
    getReceiverByRoomId = jest.fn();
    updateMessagesReadStatus = jest.fn();
}
