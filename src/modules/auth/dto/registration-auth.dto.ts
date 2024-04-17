import { LoginAuthDto } from './login-auth.dto';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class RegistrationAuthDto extends LoginAuthDto {
    @IsNotEmpty()
    firstName: string;

    @IsNotEmpty()
    lastName?: string;

    @IsOptional()
    age?: number;

    @IsOptional()
    avatar?: string;
}
