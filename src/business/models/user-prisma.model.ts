export interface UserPrismaModel {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    age: number;
    avatar: string;
    isOnline: boolean;
    createdAt?: Date;
}

export interface FullUserPrismaModel extends UserPrismaModel {
    password: string;
    acceptTerms: boolean;
}

export interface UserPrismaBody {
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    password: string;
    acceptTerms: boolean;
}
