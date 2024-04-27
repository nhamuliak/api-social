import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class FilterUserDto {
    @IsNotEmpty()
    @IsString()
    @IsOptional()
    firstName: string;

    @IsNotEmpty()
    @IsString()
    @IsOptional()
    lastName: string;

    @IsNotEmpty()
    @IsString()
    page: string;
}
