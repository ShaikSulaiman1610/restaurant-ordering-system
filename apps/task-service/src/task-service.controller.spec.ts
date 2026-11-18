
import { Test, TestingModule } from '@nestjs/testing';

import { TaskServiceController } from './task-service.controller';
import { TaskServiceService } from './task-service.service';
import { TenantConnectionService } from './infrastructure/database/tenant-connection/tenant-connection.service';

describe('TaskServiceController', () => {
  let taskServiceController: TaskServiceController;

  const mockTaskServiceService = {
    getHello: jest.fn(),
    getTenants: jest.fn(),
  };

  const mockTenantConnectionService = {
    getConnection: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    mockTaskServiceService.getHello.mockReturnValue('Hello World!');
    mockTaskServiceService.getTenants.mockResolvedValue([]);

    const app: TestingModule = await Test.createTestingModule({
      controllers: [TaskServiceController],
      providers: [
        {
          provide: TaskServiceService,
          useValue: mockTaskServiceService,
        },
        {
          provide: TenantConnectionService,
          useValue: mockTenantConnectionService,
        },
      ],
    }).compile();

    taskServiceController = app.get<TaskServiceController>(
      TaskServiceController,
    );
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(taskServiceController.getHello()).toBe('Hello World!');

      expect(
        mockTaskServiceService.getHello,
      ).toHaveBeenCalledTimes(1);
    });
  });
});
