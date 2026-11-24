import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import {
  DocumentBuilder,
  SwaggerModule,
} from '@nestjs/swagger';

import { TaskServiceModule } from './apps/task-service/src/task-service.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(TaskServiceModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Restaurant Ordering & Menu Management API')
    .setDescription(
      'Multi-tenant restaurant ordering, menu, inventory and order management API',
    )
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    })
    .addTag('Restaurants')
    .addTag('Categories')
    .addTag('Products')
    .addTag('Modifiers')
    .addTag('Inventory')
    .addTag('Orders')
    .addTag('Payments')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(
    app,
    swaggerConfig,
  );

  SwaggerModule.setup(
    'api/docs',
    app,
    swaggerDocument,
  );

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();