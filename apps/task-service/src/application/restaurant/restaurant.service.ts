
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { Tenant } from '../../infrastructure/database/entities/tenant.entity';
import { RestaurantProvisioningService } from './restaurant-provisioning.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

@Injectable()
export class RestaurantService {
  private readonly logger = new Logger(RestaurantService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly restaurantRepository: Repository<Tenant>,
    private readonly provisioningService: RestaurantProvisioningService,
  ) {}

  private isDuplicateRestaurantError(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = error.driverError as {
      code?: string;
      constraint?: string;
    };

    return (
      driverError.code === '23505' &&
      driverError.constraint === 'IDX_tenants_name_location'
    );
  }

  async create(dto: CreateRestaurantDto): Promise<Tenant> {
    const restaurantName = dto.restaurantName.trim();
    const location = dto.location.trim();

    if (!restaurantName || !location) {
      throw new BadRequestException(
        'Restaurant name and location cannot be empty',
      );
    }

    const existingRestaurant = await this.restaurantRepository
      .createQueryBuilder('restaurant')
      .where(
        'LOWER(TRIM(restaurant.restaurantName)) = LOWER(:name)',
        { name: restaurantName },
      )
      .andWhere(
        'LOWER(TRIM(restaurant.location)) = LOWER(:location)',
        { location },
      )
      .getOne();

    if (existingRestaurant) {
      throw new ConflictException(
        'Restaurant already exists at this location',
      );
    }

    const databaseName =
      this.provisioningService.generateDatabaseName();

    await this.provisioningService.provisionDatabase(databaseName);

    const restaurant = this.restaurantRepository.create({
      restaurantName,
      location,
      databaseName,
      coverImageUrl: null,
      coverImagePublicId: null,
    });

    try {
      return await this.restaurantRepository.save(restaurant);
    } catch (error: unknown) {
      try {
        await this.provisioningService.cleanupDatabase(databaseName);
      } catch (cleanupError: unknown) {
        this.logger.error(
          `Registry save failed; database cleanup also failed: ${databaseName}`,
          cleanupError instanceof Error
            ? cleanupError.stack
            : String(cleanupError),
        );
      }

      if (this.isDuplicateRestaurantError(error)) {
        throw new ConflictException(
          'Restaurant already exists at this location',
        );
      }

      throw error;
    }
  }

  async findAll(): Promise<Tenant[]> {
    return this.restaurantRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(restaurantId: string): Promise<Tenant> {
    const restaurant = await this.restaurantRepository.findOneBy({
      id: restaurantId,
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }

  async update(
    restaurantId: string,
    dto: UpdateRestaurantDto,
  ): Promise<Tenant> {
    const restaurant = await this.findOne(restaurantId);

    if (dto.restaurantName !== undefined) {
      const name = dto.restaurantName.trim();

      if (!name) {
        throw new BadRequestException(
          'Restaurant name cannot be empty',
        );
      }

      restaurant.restaurantName = name;
    }

    if (dto.location !== undefined) {
      const location = dto.location.trim();

      if (!location) {
        throw new BadRequestException(
          'Restaurant location cannot be empty',
        );
      }

      restaurant.location = location;
    }

    try {
      return await this.restaurantRepository.save(restaurant);
    } catch (error: unknown) {
      if (this.isDuplicateRestaurantError(error)) {
        throw new ConflictException(
          'Restaurant already exists at this location',
        );
      }

      throw error;
    }
  }
}
