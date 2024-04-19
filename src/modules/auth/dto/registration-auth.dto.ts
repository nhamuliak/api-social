import { LoginAuthDto } from './login-auth.dto';
import { IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';

export class RegistrationAuthDto extends LoginAuthDto {
    @IsNotEmpty()
    firstName: string;

    @IsNotEmpty()
    lastName?: string;

    @IsOptional()
    age?: number;

    @IsOptional()
    avatar?: string;

    @IsBoolean()
    acceptTerms: boolean;
}
