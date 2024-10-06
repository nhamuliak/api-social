export interface PayloadModel {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    isOnline: boolean;
    age: number;
    avatar: string;
}

export interface RefreshPayloadModel extends PayloadModel {
    refreshToken: string;
}
