import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { TermsService } from './terms.service';
import { Response } from 'express';

@Controller('terms')
export class TermsController {
    constructor(private readonly termsService: TermsService) {}

    @Get()
    async getTerms(@Res() res: Response) {
        const terms = await this.termsService.getTerms();

        return res.status(HttpStatus.OK).send(terms);
    }
}
