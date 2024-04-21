import { Response } from 'express';
import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { TermsModel } from '@models/terms.model';
import { TermsService } from './terms.service';

@Controller('terms')
export class TermsController {
    constructor(private readonly termsService: TermsService) {}

    @Get()
    async getTerms(@Res() res: Response): Promise<Response<TermsModel[]>> {
        const terms: TermsModel[] = await this.termsService.getTerms();

        return res.status(HttpStatus.OK).send(terms);
    }
}
