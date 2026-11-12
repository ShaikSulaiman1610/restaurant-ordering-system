import { Test, TestingModule } from '@nestjs/testing';
import { InboundServiceController } from './inbound-service.controller';
import { InboundServiceService } from './inbound-service.service';

describe('InboundServiceController', () => {
  let inboundServiceController: InboundServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [InboundServiceController],
      providers: [InboundServiceService],
    }).compile();

    inboundServiceController = app.get<InboundServiceController>(InboundServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(inboundServiceController.getHello()).toBe('Hello World!');
    });
  });
});
