export const mockTokensData = {
    accessToken: 'token-access-test',
    refreshToken: 'token-refresh-test'
};

export const mockAuthLoginData = {
    email: 'test@gmail.com',
    password: 'password'
};

export const mockAuthRegistrationData = {
    ...mockAuthLoginData,
    firstName: 'Test',
    lastName: 'New',
    age: 21,
    avatar: null,
    acceptTerms: true
};

export const mockAuthSocialData = {
    firstName: 'Test',
    lastName: 'New',
    email: 'test@gmail.com',
    avatar: null
};
