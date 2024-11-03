import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class MessageDto {
    @IsNumber()
    roomId: number;

    @IsNumber()
    receiverId: number;

    @IsString()
    @IsNotEmpty()
    content: string;
}
