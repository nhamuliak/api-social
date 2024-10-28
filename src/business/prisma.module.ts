import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ChatPrismaService } from './services/chat-prisma/chat-prisma.service';
import { UserPrismaService } from './services/user-prisma/user-prisma.service';

@Global()
@Module({
    providers: [PrismaService, ChatPrismaService, UserPrismaService],
    exports: [PrismaService, ChatPrismaService, UserPrismaService]
})
export class PrismaModule {}
