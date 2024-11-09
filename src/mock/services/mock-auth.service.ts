import { mockTokensData, mockUserData } from '../data';

export class MockAuthService {
    registration = jest.fn();
    login = jest.fn();
    socialAuth = () => {
        const tokens = mockTokensData;
        const user = mockUserData;

        return { tokens, user };
    };
    logout = jest.fn();
    refresh = jest.fn();
    recoverPassword = jest.fn();
    resetPassword = jest.fn();
}
