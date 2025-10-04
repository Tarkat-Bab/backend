import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const options = new DocumentBuilder()
    .setTitle('Tarket Bab Api')
    .setDescription(
      'This API provide the needed services to implement tarket-bab',
    )
    .setVersion('3.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);

  document.paths = Object.fromEntries(
    Object.entries(document.paths).map(([path, pathObject]) => [
      `${path}`,
      pathObject,
    ]),
  );

 SwaggerModule.setup('api/docs', app, document, {
  customSiteTitle: 'Tarket Bab Api Docs',
  swaggerOptions: {
    url: '/api/docs-json',
  },
  customCssUrl: 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css',
  customJs: [
    
    'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js',
    'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js',
  ],
});
}