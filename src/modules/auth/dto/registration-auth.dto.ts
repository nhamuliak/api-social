import { LoginAuthDto } from './login-auth.dto';
import { IsBoolean, IsNotEmpty, IsOptional, IsPositive } from 'class-validator';

export class RegistrationAuthDto extends LoginAuthDto {
    @IsNotEmpty()
    public firstName: string;

    @IsNotEmpty()
    public lastName?: string;

    @IsOptional()
    @IsPositive()
    public age?: number;

    @IsOptional()
    public avatar?: string;

    @IsBoolean()
    public acceptTerms: boolean;
}
