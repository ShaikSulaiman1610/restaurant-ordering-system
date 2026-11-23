
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';

import { Tenant } from '../../infrastructure/database/entities/tenant.entity';
import {
  RestaurantMembership,
  RestaurantRole,
} from '../../infrastructure/database/entities/restaurant-membership.entity';
import { CloudinaryService } from '../../infrastructure/cloudinary/cloudinary.service';
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
    private readonly cloudinaryService: CloudinaryService,
    private readonly dataSource: DataSource,
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

  async create(
    dto: CreateRestaurantDto,
    userId: string,
  ): Promise<Tenant> {
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
      return await this.dataSource.transaction(
        async (manager): Promise<Tenant> => {
          const savedRestaurant = await manager
            .getRepository(Tenant)
            .save(restaurant);

          const membership = manager
            .getRepository(RestaurantMembership)
            .create({
              userId,
              restaurantId: savedRestaurant.id,
              role: RestaurantRole.OWNER,
            });

          await manager
            .getRepository(RestaurantMembership)
            .save(membership);

          return savedRestaurant;
        },
      );
    } catch (error: unknown) {
      try {
        await this.provisioningService.cleanupDatabase(databaseName);
      } catch (cleanupError: unknown) {
        this.logger.error(
          `Registry transaction failed; database cleanup also failed: ${databaseName}`,
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

  async uploadCoverImage(
    restaurantId: string,
    file: Express.Multer.File,
  ): Promise<Tenant> {
    const restaurant = await this.findOne(restaurantId);

    const uploaded = await this.cloudinaryService.uploadImage(
      file,
      'restaurant-ordering/restaurant-covers',
    );

    const previousPublicId = restaurant.coverImagePublicId;

    try {
      const updateResult = await this.restaurantRepository
        .createQueryBuilder()
        .update(Tenant)
        .set({
          coverImageUrl: uploaded.url,
          coverImagePublicId: uploaded.publicId,
        })
        .where('id = :restaurantId', { restaurantId })
        .andWhere(
          'cover_image_public_id IS NOT DISTINCT FROM :previousPublicId',
          { previousPublicId },
        )
        .execute();

      if (updateResult.affected !== 1) {
        throw new ConflictException(
          'Restaurant cover image was modified concurrently',
        );
      }
    } catch (error: unknown) {
      try {
        await this.cloudinaryService.deleteImage(uploaded.publicId);
      } catch (cleanupError: unknown) {
        this.logger.error(
          'Failed to clean up newly uploaded cover image',
          cleanupError instanceof Error
            ? cleanupError.stack
            : String(cleanupError),
        );
      }

      throw error;
    }

    if (previousPublicId) {
      try {
        await this.cloudinaryService.deleteImage(previousPublicId);
      } catch (error: unknown) {
        this.logger.warn(
          `Old restaurant cover image cleanup failed: ${previousPublicId}`,
        );
      }
    }

    return this.findOne(restaurantId);
  }

  async deleteCoverImage(restaurantId: string): Promise<Tenant> {
    const restaurant = await this.findOne(restaurantId);

    if (!restaurant.coverImagePublicId) {
      throw new BadRequestException(
        'Restaurant does not have a cover image',
      );
    }

    const previousPublicId = restaurant.coverImagePublicId;

    const result = await this.restaurantRepository
      .createQueryBuilder()
      .update(Tenant)
      .set({
        coverImageUrl: null,
        coverImagePublicId: null,
      })
      .where('id = :restaurantId', { restaurantId })
      .andWhere('cover_image_public_id = :previousPublicId', {
        previousPublicId,
      })
      .execute();

    if (result.affected !== 1) {
      throw new ConflictException(
        'Restaurant cover image was modified concurrently',
      );
    }

    try {
      await this.cloudinaryService.deleteImage(previousPublicId);
    } catch (error: unknown) {
      this.logger.warn(
        `Cover image deletion from Cloudinary failed: ${previousPublicId}`,
      );
    }

    return this.findOne(restaurantId);
  }
}
