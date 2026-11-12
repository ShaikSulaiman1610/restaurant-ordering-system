import { Controller, Get } from '@nestjs/common';
import { OutboundServiceService } from './outbound-service.service';

@Controller()
export class OutboundServiceController {
  constructor(private readonly outboundServiceService: OutboundServiceService) {}

  @Get()
  getHello(): string {
    return this.outboundServiceService.getHello();
  }
}
