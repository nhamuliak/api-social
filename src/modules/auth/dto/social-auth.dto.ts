import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SocialAuthDto {
    @IsNotEmpty()
    public firstName: string;

    @IsNotEmpty()
    public lastName: string;

    @IsOptional()
    public avatar?: string;

    @IsNotEmpty()
    @IsString()
    @IsEmail()
    email: string;
}
