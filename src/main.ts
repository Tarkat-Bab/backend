import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express'; 
import { ExpressAdapter } from '@nestjs/platform-express';

import helmet from 'helmet';
import * as morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';

import { setupSwagger } from './common/swagger';
import { SeedsService } from './modules/seeds/seeds.service';

// Create Express instance
const expressApp = express(); 
const adapter = new ExpressAdapter(expressApp);

let app;

async function bootstrap() {
  if (!app) {
    app = await NestFactory.create(AppModule, adapter);
    app.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      allowedHeaders: '*',
    });
    // app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    
    // Configure security and middleware
    app.use(helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    }));
    
    // Only use morgan in development
    if (process.env.NODE_ENV !== 'production') {
      app.use(morgan('combined'));
    }
    
    app.use(rateLimit({
      windowMs: 15 * 60 * 1000, 
      max: 100, 
    }));

    // Run seeds only in specific environments or with a flag
    const seedsService = app.get(SeedsService);
    await seedsService.seedDatabase();
    
    setupSwagger(app);

    await app.init();
  }
  return app;
}

// For local development
if (process.env.NODE_ENV !== 'production') {
  bootstrap().then(app => {
    app.listen(3000);
    console.log('Listening on port 3000');
  });
}

// Export handler for serverless
export default async function handler(req, res) {
  await bootstrap();
  // return expressApp(req, res);
  return server(req, res);

}
