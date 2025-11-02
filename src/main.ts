import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';

import helmet from 'helmet';
import * as morgan from 'morgan';
import * as crypto from 'crypto';
import { rateLimit } from 'express-rate-limit';
import express = require('express'); // Using require syntax for CommonJS modules

import { setupSwagger } from './common/swagger';
import { SeedsService } from './modules/seeds/seeds.service';

if (!(globalThis as any).crypto) {
	(globalThis as any).crypto = {
		randomUUID: (crypto as any).randomUUID?.bind(crypto) ?? (() => {
			// Fallback: use UUID v4 via random bytes if randomUUID not available
			const bytes = crypto.randomBytes(16);
			// Per RFC 4122 v4
			bytes[6] = (bytes[6] & 0x0f) | 0x40;
			bytes[8] = (bytes[8] & 0x3f) | 0x80;
			const hex = bytes.toString('hex');
			return `${hex.substr(0,8)}-${hex.substr(8,4)}-${hex.substr(12,4)}-${hex.substr(16,4)}-${hex.substr(20,12)}`;
		})
	};
}
if (!(global as any).crypto) {
	(global as any).crypto = (globalThis as any).crypto;
}


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
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ transform: true }));    
    app.use(helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    }));    

    // Only use morgan in development
    if (process.env.NODE_ENV !== 'production') {
      app.use(morgan('combined'));
    }    
    // app.use(rateLimit({
    //   windowMs: 15 * 60 * 1000, 
    //   max: 100, 
    // }));

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
    app.listen(process.env.PORT || 3000);
  });
}

// Export handler for serverless
export default async function handler(req, res) {
  await bootstrap();
  return expressApp(req, res); // Fixed variable name reference
}
