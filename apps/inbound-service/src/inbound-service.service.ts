import { Injectable } from '@nestjs/common';

@Injectable()
export class InboundServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
