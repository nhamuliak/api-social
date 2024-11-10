import { Module } from '@nestjs/common';
import { TermsService } from './services/terms.service';
import { TermsController } from './controllers/terms.controller';

@Module({
    controllers: [TermsController],
    providers: [TermsService]
})
export class TermsModule {}
