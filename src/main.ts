import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { ErrorHandlerFilter } from '@core/filters/error-handler/error-handler.filter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.setGlobalPrefix('api');
    app.enableCors({ origin: true, credentials: true });
    app.use(cookieParser('secret'));
    app.use(cookieParser());
    app.useGlobalFilters(new ErrorHandlerFilter());
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true
        })
    );

    await app.listen(3000);
}
bootstrap();
