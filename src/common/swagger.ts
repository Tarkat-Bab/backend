import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import * as express from 'express';

export function setupSwagger(app: INestApplication): void {
  // Serve Swagger UI static files
  app.use(
    '/api/docs',
    express.static(join(process.cwd(), 'node_modules/swagger-ui-dist')),
  );

  const options = new DocumentBuilder()
    .setTitle('Tarket Bab Api')
    .setDescription(
      'This API provide the needed services to implement tarket-bab',
    )
    .setVersion('3.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);

  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Tarket Bab Api Docs',
    customJs: [
      '/api/docs/swagger-ui-bundle.js',
      '/api/docs/swagger-ui-standalone-preset.js',
    ],
    customCssUrl: '/api/docs/swagger-ui.css',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}
