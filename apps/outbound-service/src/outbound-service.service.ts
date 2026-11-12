import { Injectable } from '@nestjs/common';

@Injectable()
export class OutboundServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
