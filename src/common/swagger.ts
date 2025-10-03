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

  // Set up Swagger at both paths to ensure it works in all environments
  SwaggerModule.setup('api/docs', app, document);  // For access with the global prefix
  SwaggerModule.setup('docs', app, document);      // For direct access
}
