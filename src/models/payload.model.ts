export interface PayloadModel {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    isOnline: boolean;
}

export interface RefreshPayloadModel extends PayloadModel {
    refreshToken: string;
}
