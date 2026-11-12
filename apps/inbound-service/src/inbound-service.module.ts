import { Module } from '@nestjs/common';
import { InboundServiceController } from './inbound-service.controller';
import { InboundServiceService } from './inbound-service.service';

@Module({
  imports: [],
  controllers: [InboundServiceController],
  providers: [InboundServiceService],
})
export class InboundServiceModule {}
