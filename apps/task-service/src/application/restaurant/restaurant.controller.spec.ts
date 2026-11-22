
import { RestaurantController } from './restaurant.controller';
import { RestaurantService } from './restaurant.service';
import { Tenant } from '../../infrastructure/database/entities/tenant.entity';

describe('RestaurantController', () => {
  let controller: RestaurantController;

  let restaurantService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
  };

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

  it('registers a restaurant', async () => {
    const dto = {
      restaurantName: 'Spice Garden',
      location: 'Madurai',
    };

    const result = await controller.create(dto);

    expect(result).toEqual(restaurant);
    expect(restaurantService.create).toHaveBeenCalledWith(dto);
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
