import { NestFactory } from '@nestjs/core';
import { OutboundServiceModule } from './outbound-service.module';

async function bootstrap() {
  const app = await NestFactory.create(OutboundServiceModule);
  await app.listen(process.env.port ?? 3000);
}
void bootstrap();
