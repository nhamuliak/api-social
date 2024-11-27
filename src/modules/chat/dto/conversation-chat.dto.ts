import { IsNumber } from 'class-validator';

export class ConversationChatDto {
    @IsNumber()
    receiverId: number;
}
