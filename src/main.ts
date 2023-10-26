import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParserConfig = require('cookie-parser');
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  app.use((cookieParserConfig as any)());
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: 'https://tea-z.vercel.app/',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: '*',
    credentials: true,
    preflightContinue: true,
  });
  await app.listen(4000);
}
bootstrap();
