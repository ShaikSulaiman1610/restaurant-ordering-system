
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';

import {
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { RestaurantService } from './restaurant.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

@ApiTags('Restaurants')
@Controller('restaurants')
export class RestaurantController {
  constructor(
    private readonly restaurantService: RestaurantService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Register a new restaurant',
    description:
      'Creates a restaurant and provisions a separate PostgreSQL database.',
  })
  @ApiBody({ type: CreateRestaurantDto })
  @ApiCreatedResponse({
    description: 'Restaurant registered successfully',
  })
  @ApiConflictResponse({
    description:
      'A restaurant with the same name and location already exists',
  })
  async create(@Body() dto: CreateRestaurantDto) {
    return this.restaurantService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List all registered restaurants',
  })
  @ApiOkResponse({
    description: 'Restaurants retrieved successfully',
  })
  async findAll() {
    return this.restaurantService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get restaurant details by ID',
  })
  @ApiOkResponse({
    description: 'Restaurant retrieved successfully',
  })
  @ApiNotFoundResponse({
    description: 'Restaurant not found',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) restaurantId: string,
  ) {
    return this.restaurantService.findOne(restaurantId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update restaurant name or location',
  })
  @ApiBody({ type: UpdateRestaurantDto })
  @ApiOkResponse({
    description: 'Restaurant updated successfully',
  })
  @ApiNotFoundResponse({
    description: 'Restaurant not found',
  })
  @ApiConflictResponse({
    description:
      'Another restaurant already uses the same name and location',
  })
  async update(
    @Param('id', ParseUUIDPipe) restaurantId: string,
    @Body() dto: UpdateRestaurantDto,
  ) {
    return this.restaurantService.update(restaurantId, dto);
  }
}
