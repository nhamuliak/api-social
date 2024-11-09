export const mockRequest = () => {
    const res = {
        url: '/test-url',
        user: {
            id: 1,
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe'
        }
    } as any;

    return res;
};
