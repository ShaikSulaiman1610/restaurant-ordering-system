import { Controller, Get } from '@nestjs/common';
import { InboundServiceService } from './inbound-service.service';

@Controller()
export class InboundServiceController {
  constructor(private readonly inboundServiceService: InboundServiceService) {}

  @Get()
  getHello(): string {
    return this.inboundServiceService.getHello();
  }
}
