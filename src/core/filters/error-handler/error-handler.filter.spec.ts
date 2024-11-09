import { Request, Response } from 'express';
import { ErrorHandlerFilter } from './error-handler.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { mockRequest, mockResponse } from '@mock/helper';

describe('ErrorHandlerFilter', () => {
    let filter: ErrorHandlerFilter<Error>;
    let mockArgumentsHost: ArgumentsHost;
    let res: Response;
    let req: Request;

    beforeEach(() => {
        filter = new ErrorHandlerFilter();

        res = mockResponse();
        req = mockRequest();

        mockArgumentsHost = {
            switchToHttp: jest.fn().mockReturnValue({
                getResponse: () => res,
                getRequest: () => req
            })
        } as unknown as ArgumentsHost;
    });

    it('should be defined', () => {
        expect(new ErrorHandlerFilter()).toBeDefined();
    });

    it('should handle HttpException correctly', () => {
        const exception = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);

        filter.catch(exception, mockArgumentsHost);

        expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
        expect(res.json).toHaveBeenCalledWith({
            statusCode: HttpStatus.BAD_REQUEST,
            timestamp: expect.any(String),
            path: req.url,
            message: 'Bad Request'
        });
    });

    it('should handle non-HttpException and default to INTERNAL_SERVER_ERROR', () => {
        const exception = new Error('Something went wrong');

        filter.catch(exception, mockArgumentsHost);

        expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(res.json).toHaveBeenCalledWith({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            timestamp: expect.any(String),
            path: req.url,
            message: 'Internal server error'
        });
    });
});
