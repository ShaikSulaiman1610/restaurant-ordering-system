
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';

import { RestaurantService } from './restaurant.service';
import { RestaurantProvisioningService } from './restaurant-provisioning.service';
import { CloudinaryService } from '../../infrastructure/cloudinary/cloudinary.service';
import { Tenant } from '../../infrastructure/database/entities/tenant.entity';
import {
  RestaurantMembership,
  RestaurantRole,
} from '../../infrastructure/database/entities/restaurant-membership.entity';

describe('RestaurantService', () => {
  const databaseName =
    'restaurant_1234567890abcdef1234567890abcdef_db';

  const userId = 'user-uuid';

  const restaurant = {
    id: 'restaurant-uuid',
    restaurantName: 'Spice Garden',
    location: 'Madurai',
    databaseName,
    coverImageUrl: null,
    coverImagePublicId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Tenant;

  let service: RestaurantService;

  let repository: {
    createQueryBuilder: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOneBy: jest.Mock;
  };

  let provisioningService: {
    generateDatabaseName: jest.Mock;
    provisionDatabase: jest.Mock;
    cleanupDatabase: jest.Mock;
  };

  let cloudinaryService: {
    uploadImage: jest.Mock;
    deleteImage: jest.Mock;
  };

  let queryBuilder: {
    where: jest.Mock;
    andWhere: jest.Mock;
    getOne: jest.Mock;
  };

  let tenantTransactionRepository: {
    save: jest.Mock;
  };

  let membershipTransactionRepository: {
    create: jest.Mock;
    save: jest.Mock;
  };

  let transactionManager: {
    getRepository: jest.Mock;
  };

  let dataSource: {
    transaction: jest.Mock;
  };

  beforeEach(() => {
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };

    repository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn().mockResolvedValue(restaurant),
      find: jest.fn().mockResolvedValue([restaurant]),
      findOneBy: jest.fn().mockResolvedValue(restaurant),
    };

    provisioningService = {
      generateDatabaseName: jest.fn().mockReturnValue(databaseName),
      provisionDatabase: jest.fn().mockResolvedValue(undefined),
      cleanupDatabase: jest.fn().mockResolvedValue(undefined),
    };

    cloudinaryService = {
      uploadImage: jest.fn(),
      deleteImage: jest.fn(),
    };

    tenantTransactionRepository = {
      save: jest.fn().mockResolvedValue(restaurant),
    };

    membershipTransactionRepository = {
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn().mockImplementation(async (data) => data),
    };

    transactionManager = {
      getRepository: jest.fn().mockImplementation((entity) => {
        if (entity === Tenant) {
          return tenantTransactionRepository;
        }

        if (entity === RestaurantMembership) {
          return membershipTransactionRepository;
        }

        throw new Error('Unexpected entity in transaction');
      }),
    };

    dataSource = {
      transaction: jest.fn().mockImplementation(
        async (callback) => callback(transactionManager),
      ),
    };

    service = new RestaurantService(
      repository as never,
      provisioningService as unknown as RestaurantProvisioningService,
      cloudinaryService as unknown as CloudinaryService,
      dataSource as unknown as DataSource,
    );
  });

  describe('create', () => {
    it('creates a restaurant with its own database', async () => {
      const result = await service.create(
        {
          restaurantName: ' Spice Garden ',
          location: ' Madurai ',
        },
        userId,
      );

      expect(result).toEqual(restaurant);

      expect(
        provisioningService.generateDatabaseName,
      ).toHaveBeenCalledTimes(1);

      expect(
        provisioningService.provisionDatabase,
      ).toHaveBeenCalledWith(databaseName);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          restaurantName: 'Spice Garden',
          location: 'Madurai',
          databaseName,
        }),
      );

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);

      expect(
        tenantTransactionRepository.save,
      ).toHaveBeenCalledTimes(1);

      expect(
        membershipTransactionRepository.create,
      ).toHaveBeenCalledWith({
        userId,
        restaurantId: restaurant.id,
        role: RestaurantRole.OWNER,
      });

      expect(
        membershipTransactionRepository.save,
      ).toHaveBeenCalledTimes(1);

      expect(repository.save).not.toHaveBeenCalled();
    });

    it('rejects an empty restaurant name', async () => {
      await expect(
        service.create(
          {
            restaurantName: '   ',
            location: 'Madurai',
          },
          userId,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(
        provisioningService.provisionDatabase,
      ).not.toHaveBeenCalled();
    });

    it('rejects an empty location', async () => {
      await expect(
        service.create(
          {
            restaurantName: 'Spice Garden',
            location: '   ',
          },
          userId,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(
        provisioningService.provisionDatabase,
      ).not.toHaveBeenCalled();
    });

    it('rejects an existing restaurant before provisioning', async () => {
      queryBuilder.getOne.mockResolvedValue(restaurant);

      await expect(
        service.create(
          {
            restaurantName: 'Spice Garden',
            location: 'Madurai',
          },
          userId,
        ),
      ).rejects.toThrow(ConflictException);

      expect(
        provisioningService.provisionDatabase,
      ).not.toHaveBeenCalled();
    });

    it('does not save when provisioning fails', async () => {
      provisioningService.provisionDatabase.mockRejectedValue(
        new Error('Database creation failed'),
      );

      await expect(
        service.create(
          {
            restaurantName: 'Spice Garden',
            location: 'Madurai',
          },
          userId,
        ),
      ).rejects.toThrow('Database creation failed');

      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('cleans up when registry save fails', async () => {
      tenantTransactionRepository.save.mockRejectedValue(
        new Error('Registry unavailable'),
      );

      await expect(
        service.create(
          {
            restaurantName: 'Spice Garden',
            location: 'Madurai',
          },
          userId,
        ),
      ).rejects.toThrow('Registry unavailable');

      expect(
        provisioningService.cleanupDatabase,
      ).toHaveBeenCalledWith(databaseName);

      expect(
        membershipTransactionRepository.save,
      ).not.toHaveBeenCalled();
    });

    it('preserves the original error if cleanup also fails', async () => {
      tenantTransactionRepository.save.mockRejectedValue(
        new Error('Registry unavailable'),
      );

      provisioningService.cleanupDatabase.mockRejectedValue(
        new Error('Cleanup failed'),
      );

      await expect(
        service.create(
          {
            restaurantName: 'Spice Garden',
            location: 'Madurai',
          },
          userId,
        ),
      ).rejects.toThrow('Registry unavailable');

      expect(
        provisioningService.cleanupDatabase,
      ).toHaveBeenCalledTimes(1);
    });

    it('returns conflict for a concurrent duplicate', async () => {
      const duplicateError = new QueryFailedError(
        'INSERT INTO tenants ...',
        [],
        Object.assign(new Error('Duplicate restaurant'), {
          code: '23505',
          constraint: 'IDX_tenants_name_location',
        }),
      );

      tenantTransactionRepository.save.mockRejectedValue(
        duplicateError,
      );

      await expect(
        service.create(
          {
            restaurantName: 'Spice Garden',
            location: 'Madurai',
          },
          userId,
        ),
      ).rejects.toThrow(ConflictException);

      expect(
        provisioningService.cleanupDatabase,
      ).toHaveBeenCalledWith(databaseName);
    });

    it('creates OWNER membership for the authenticated user', async () => {
      await service.create(
        {
          restaurantName: 'Spice Garden',
          location: 'Madurai',
        },
        userId,
      );

      expect(
        membershipTransactionRepository.create,
      ).toHaveBeenCalledWith({
        userId,
        restaurantId: restaurant.id,
        role: RestaurantRole.OWNER,
      });

      expect(
        membershipTransactionRepository.save,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          restaurantId: restaurant.id,
          role: RestaurantRole.OWNER,
        }),
      );
    });

    it('cleans up the provisioned database when membership save fails', async () => {
      membershipTransactionRepository.save.mockRejectedValue(
        new Error('Membership save failed'),
      );

      await expect(
        service.create(
          {
            restaurantName: 'Spice Garden',
            location: 'Madurai',
          },
          userId,
        ),
      ).rejects.toThrow('Membership save failed');

      expect(
        tenantTransactionRepository.save,
      ).toHaveBeenCalledTimes(1);

      expect(
        provisioningService.cleanupDatabase,
      ).toHaveBeenCalledWith(databaseName);
    });

    it('does not create membership when restaurant save fails', async () => {
      tenantTransactionRepository.save.mockRejectedValue(
        new Error('Restaurant insert failed'),
      );

      await expect(
        service.create(
          {
            restaurantName: 'Spice Garden',
            location: 'Madurai',
          },
          userId,
        ),
      ).rejects.toThrow('Restaurant insert failed');

      expect(
        membershipTransactionRepository.create,
      ).not.toHaveBeenCalled();

      expect(
        membershipTransactionRepository.save,
      ).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns all restaurants', async () => {
      const result = await service.findAll();

      expect(result).toEqual([restaurant]);

      expect(repository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('returns a restaurant by ID', async () => {
      const result = await service.findOne('restaurant-uuid');

      expect(result).toEqual(restaurant);
    });

    it('throws NotFoundException for an unknown ID', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(
        service.findOne('unknown-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates the restaurant name and location', async () => {
      const updatedRestaurant = {
        ...restaurant,
        restaurantName: 'New Spice Garden',
        location: 'Chennai',
      };

      repository.findOneBy.mockResolvedValue({
        ...restaurant,
      });

      repository.save.mockResolvedValue(updatedRestaurant);

      const result = await service.update('restaurant-uuid', {
        restaurantName: ' New Spice Garden ',
        location: ' Chennai ',
      });

      expect(result).toEqual(updatedRestaurant);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          restaurantName: 'New Spice Garden',
          location: 'Chennai',
        }),
      );
    });

    it('rejects an empty updated name', async () => {
      await expect(
        service.update('restaurant-uuid', {
          restaurantName: '   ',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an empty updated location', async () => {
      await expect(
        service.update('restaurant-uuid', {
          location: '   ',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects duplicate restaurant details on update', async () => {
      const duplicateError = new QueryFailedError(
        'UPDATE tenants ...',
        [],
        Object.assign(new Error('Duplicate restaurant'), {
          code: '23505',
          constraint: 'IDX_tenants_name_location',
        }),
      );

      repository.findOneBy.mockResolvedValue({
        ...restaurant,
      });

      repository.save.mockRejectedValue(duplicateError);

      await expect(
        service.update('restaurant-uuid', {
          location: 'Chennai',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
