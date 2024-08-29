import { Injectable } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { PrismaService } from '@core/prisma/prisma.service';

@Injectable()
export class ChatService {
    constructor(private readonly prismaService: PrismaService) {}

    public async create(createChatDto: CreateChatDto): Promise<void> {
        await this.prismaService.messages.create({
            data: {
                text: createChatDto.text,
                conversationId: createChatDto.conversationId,
                userId: createChatDto.userId
            }
        });
    }

    public async findAll(conversationId: number) {
        await this.prismaService.conversations.findFirst({
            where: {
                id: conversationId
            },
            select: {
                messages: true
            }
        });
    }

    findOne(id: number) {
        return `This action returns a #${id} chat`;
    }

    update(id: number, updateChatDto: UpdateChatDto) {
        return `This action updates a #${id} chat`;
    }

    remove(id: number) {
        return `This action removes a #${id} chat`;
    }
}
