import { UserModel } from '@models/user.model';

export interface AuthResponse {
    accessToken: string;
    user: UserModel;
}
