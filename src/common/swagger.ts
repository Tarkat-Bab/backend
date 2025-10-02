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

  // if (process.env.NODE_ENV === 'production') {
  document.paths = Object.fromEntries(
    Object.entries(document.paths).map(([path, pathObject]) => [
      `${path}`,
      pathObject,
    ]),
  );
  //}
  SwaggerModule.setup('docs', app, document);
}
