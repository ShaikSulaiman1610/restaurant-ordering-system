
import { ConfigService } from '@nestjs/config';

import { RestaurantProvisioningService } from './restaurant-provisioning.service';

describe('RestaurantProvisioningService Safety', () => {
  let service: RestaurantProvisioningService;

  beforeEach(() => {
    const configService = {
      getOrThrow: jest.fn(),
    } as unknown as ConfigService;

    service = new RestaurantProvisioningService(configService);
  });

  it('generates a valid database name', () => {
    const databaseName = service.generateDatabaseName();

    expect(databaseName).toMatch(
      /^restaurant_[a-f0-9]{32}_db$/,
    );
  });

  it('generates unique database names', () => {
    const firstName = service.generateDatabaseName();
    const secondName = service.generateDatabaseName();

    expect(firstName).not.toBe(secondName);
  });

  it('rejects cleanup of Restaurant A database', async () => {
    await expect(
      service.cleanupDatabase('restaurant_a_db'),
    ).rejects.toThrow('Invalid generated restaurant database name');
  });

  it('rejects cleanup of Restaurant B database', async () => {
    await expect(
      service.cleanupDatabase('restaurant_b_db'),
    ).rejects.toThrow('Invalid generated restaurant database name');
  });

  it('rejects cleanup of registry database', async () => {
    await expect(
      service.cleanupDatabase('restaurant_registry'),
    ).rejects.toThrow('Invalid generated restaurant database name');
  });

  it('rejects cleanup of a database not created by this service', async () => {
    const databaseName = service.generateDatabaseName();

    await expect(
      service.cleanupDatabase(databaseName),
    ).rejects.toThrow(
      'Cleanup denied: database was not created by this service instance',
    );
  });

  it('rejects SQL injection in database names', async () => {
    await expect(
      service.cleanupDatabase('restaurant_test_db"; DROP DATABASE postgres;--'),
    ).rejects.toThrow('Invalid generated restaurant database name');
  });

  it('rejects provisioning with an invalid database name', async () => {
    await expect(
      service.provisionDatabase('restaurant_a_db'),
    ).rejects.toThrow('Invalid generated restaurant database name');
  });
});
