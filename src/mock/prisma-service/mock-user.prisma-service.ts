export class MockUserPrismaService {
    public getFullUserByEmailOrId = jest.fn();
    public getUserByEmail = jest.fn();
    public createUser = jest.fn();
    public updateUserById = jest.fn();
    public getUsers = jest.fn();
    public updateUserOnlineStatusById = jest.fn();
    public getUserById = jest.fn();
}
