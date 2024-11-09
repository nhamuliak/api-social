export interface UserModel {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    age: number;
    avatar: string;
    isOnline: boolean;
    createdAt: Date;
}

export interface FullUserModel extends UserModel {
    password: string;
}
