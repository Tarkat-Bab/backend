import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';

// Create Express server
const server = express();

// Create async bootstrap function
async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server),
  );

  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());

  // For local development
  if (process.env.NODE_ENV !== 'production') {
    await app.listen(3000);
  }

  return app;
}

// Initialize the NestJS application
let cachedApp;

async function handler(req, res) {
  if (!cachedApp) {
    cachedApp = await bootstrap();
    await cachedApp.init();
  }

  server(req, res);
}

// Export handler for serverless environments
export default handler;

// For local development
if (process.env.NODE_ENV !== 'production') {
  bootstrap();
}
