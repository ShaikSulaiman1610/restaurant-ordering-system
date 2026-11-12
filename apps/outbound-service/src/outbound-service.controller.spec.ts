import { Test, TestingModule } from '@nestjs/testing';
import { OutboundServiceController } from './outbound-service.controller';
import { OutboundServiceService } from './outbound-service.service';

describe('OutboundServiceController', () => {
  let outboundServiceController: OutboundServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [OutboundServiceController],
      providers: [OutboundServiceService],
    }).compile();

    outboundServiceController = app.get<OutboundServiceController>(OutboundServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(outboundServiceController.getHello()).toBe('Hello World!');
    });
  });
});
