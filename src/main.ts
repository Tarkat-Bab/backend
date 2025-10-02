import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';

import helmet        from 'helmet';
import * as morgan   from 'morgan';
import { rateLimit } from 'express-rate-limit';

import { setupSwagger } from './common/swagger';
import { SeedsService } from './modules/seeds/seeds.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: '*',
  });

  setupSwagger(app);

  app.use(helmet());
  app.use(morgan('combined'));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
    }),
  );

  // if (process.env.NODE_ENV !== 'production') app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const seedsService = app.get(SeedsService);
  seedsService.seedDatabase();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
