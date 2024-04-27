import { IsNotEmpty, IsPositive, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
    @IsNotEmpty()
    firstName: string;

    @IsNotEmpty()
    lastName: string;

    @IsPositive()
    age: number;

    @IsString()
    avatar: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(5)
    oldPassword?: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(5)
    password: string;
}
