export class MockBasicPrismaService {
    public $transaction = jest.fn();

    public users = {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn()
    };

    public rooms = {
        findUnique: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        createMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn()
    };

    public roomUsers = {
        findMany: jest.fn(),
        groupBy: jest.fn(),
        createMany: jest.fn(),
        findFirst: jest.fn(),
        deleteMany: jest.fn()
    };

    public messages = {
        create: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn(),
        updateMany: jest.fn()
    };
}
