import { NestFactory } from '@nestjs/core';
import { InboundServiceModule } from './inbound-service.module';

async function bootstrap() {
  const app = await NestFactory.create(InboundServiceModule);
  await app.listen(process.env.port ?? 3000);
}
void bootstrap();
