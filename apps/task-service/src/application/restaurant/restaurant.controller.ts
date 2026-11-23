
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { memoryStorage } from 'multer';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard';

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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Register a new restaurant',
    description:
      'Requires JWT authentication. Creates a restaurant and provisions a separate PostgreSQL database.',
  })
  @ApiBody({
    type: CreateRestaurantDto,
  })
  @ApiCreatedResponse({
    description: 'Restaurant registered successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired JWT token',
  })
  @ApiConflictResponse({
    description:
      'A restaurant with the same name and location already exists',
  })
  async create(
    @Body() dto: CreateRestaurantDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.restaurantService.create(
      dto,
      request.user!.id,
    );
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
  @ApiBody({
    type: UpdateRestaurantDto,
  })
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
    return this.restaurantService.update(
      restaurantId,
      dto,
    );
  }

  @Post(':id/cover-image')
  @ApiOperation({
    summary: 'Upload or replace restaurant cover image',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
      },
    }),
  )
  @ApiCreatedResponse({
    description:
      'Restaurant cover image uploaded successfully',
  })
  @ApiNotFoundResponse({
    description: 'Restaurant not found',
  })
  async uploadCoverImage(
    @Param('id', ParseUUIDPipe) restaurantId: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /image\/(jpeg|png|webp)/,
        })
        .addMaxSizeValidator({
          maxSize: 5 * 1024 * 1024,
        })
        .build({
          errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        }),
    )
    file: Express.Multer.File,
  ) {
    return this.restaurantService.uploadCoverImage(
      restaurantId,
      file,
    );
  }

  @Delete(':id/cover-image')
  @ApiOperation({
    summary: 'Delete restaurant cover image',
  })
  @ApiOkResponse({
    description:
      'Restaurant cover image deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'Restaurant not found',
  })
  async deleteCoverImage(
    @Param('id', ParseUUIDPipe) restaurantId: string,
  ) {
    return this.restaurantService.deleteCoverImage(
      restaurantId,
    );
  }
}
