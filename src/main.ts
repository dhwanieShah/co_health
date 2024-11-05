import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { json, urlencoded } from 'body-parser';

import { logger } from './logger/winston.logger';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { CustomExceptionFilter } from './exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });
  app.use(
    '/api/v1/subscription/webhook', // Specify the correct route
    bodyParser.raw({ type: 'application/json' }), // Parse the raw body
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const errorMessages = errors.map(
          (error) =>
            `${error.property}: ${Object.values(error.constraints).join(' ^ ')}`,
        );
        return new BadRequestException(errorMessages.join(' ^ '));
      },
    }),
  );

  const configService = app.get(ConfigService);
  // Add body parsers
  app.use(json());
  app.use(urlencoded({ extended: true }));
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new CustomExceptionFilter());
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: '*',
  });
  const port = configService.get<number>('PORT');
  await app.listen(port);
  logger.info(`Application is running on: http://localhost:${port}`);
}
bootstrap();
