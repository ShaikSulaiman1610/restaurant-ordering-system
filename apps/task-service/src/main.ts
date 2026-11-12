
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { TaskServiceModule } from './task-service.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(TaskServiceModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
