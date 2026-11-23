
import { RestaurantController } from './restaurant.controller';
import { RestaurantService } from './restaurant.service';
import { Tenant } from '../../infrastructure/database/entities/tenant.entity';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard';

describe('RestaurantController', () => {
  let controller: RestaurantController;

  let restaurantService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
  };

  const userId = 'e61b0677-3738-4eb7-a4d6-f04ff47d7c36';

  const restaurant = {
    id: 'd6570f55-1a96-4f3d-a408-e1f99a49a7c7',
    restaurantName: 'Spice Garden',
    location: 'Madurai',
    databaseName: 'restaurant_test_db',
    coverImageUrl: null,
    coverImagePublicId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Tenant;

  beforeEach(() => {
    restaurantService = {
      create: jest.fn().mockResolvedValue(restaurant),
      findAll: jest.fn().mockResolvedValue([restaurant]),
      findOne: jest.fn().mockResolvedValue(restaurant),
      update: jest.fn().mockResolvedValue(restaurant),
    };

    controller = new RestaurantController(
      restaurantService as unknown as RestaurantService,
    );
  });

  it('registers a restaurant for the authenticated user', async () => {
    const dto = {
      restaurantName: 'Spice Garden',
      location: 'Madurai',
    };

    const request = {
      user: {
        id: userId,
        email: 'auth-test-01@example.com',
      },
    } as AuthenticatedRequest;

    const result = await controller.create(dto, request);

    expect(result).toEqual(restaurant);

    expect(restaurantService.create).toHaveBeenCalledWith(
      dto,
      userId,
    );

    expect(restaurantService.create).toHaveBeenCalledTimes(1);
  });

  it('lists all restaurants', async () => {
    const result = await controller.findAll();

    expect(result).toEqual([restaurant]);

    expect(restaurantService.findAll).toHaveBeenCalledTimes(1);
  });

  it('returns a restaurant by ID', async () => {
    const result = await controller.findOne(restaurant.id);

    expect(result).toEqual(restaurant);

    expect(restaurantService.findOne).toHaveBeenCalledWith(
      restaurant.id,
    );
  });

  it('updates restaurant details', async () => {
    const dto = {
      restaurantName: 'New Spice Garden',
      location: 'Chennai',
    };

    const result = await controller.update(restaurant.id, dto);

    expect(result).toEqual(restaurant);

    expect(restaurantService.update).toHaveBeenCalledWith(
      restaurant.id,
      dto,
    );
  });
});
