import { Module } from '@nestjs/common';
import { OutboundServiceController } from './outbound-service.controller';
import { OutboundServiceService } from './outbound-service.service';

@Module({
  imports: [],
  controllers: [OutboundServiceController],
  providers: [OutboundServiceService],
})
export class OutboundServiceModule {}
