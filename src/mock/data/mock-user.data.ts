export const mockUserData = {
    id: 1,
    email: 'jack@gmail.com',
    firstName: 'Jack',
    lastName: 'Doe',
    age: 21,
    avatar: '',
    isOnline: false
};

export const mockFullUserData = {
    ...mockUserData,
    password: 'qwe123',
    acceptTerms: true,
    createdAt: new Date()
};

export const mockUpdateUserData = {
    firstName: 'Johnny',
    lastName: 'Doe'
};

export const mockCreateUserData = {
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    password: 'qwe123',
    acceptTerms: true
};
