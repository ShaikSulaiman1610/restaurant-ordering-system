
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';

import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from '../../infrastructure/database/entities/category/category.entity';

@ApiTags('Categories')
@ApiParam({
  name: 'tenantId',
  description: 'Unique restaurant ID (UUID)',
  type: String,
  format: 'uuid',
})
@Controller('tenants/:tenantId/categories')
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new category',
    description: 'Creates a menu category for the specified restaurant.',
  })
  @ApiCreatedResponse({
    description: 'Category created successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid category data or restaurant ID.',
  })
  @ApiConflictResponse({
    description: 'Category conflicts with an existing record.',
  })
  async create(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateCategoryDto,
  ): Promise<Category> {
    return this.categoryService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all categories',
    description: 'Returns all menu categories for a restaurant.',
  })
  @ApiOkResponse({
    description: 'Categories retrieved successfully.',
  })
  async findAll(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
  ): Promise<Category[]> {
    return this.categoryService.findAll(tenantId);
  }

  @Get(':categoryId')
  @ApiOperation({
    summary: 'Get category by ID',
  })
  @ApiParam({
    name: 'categoryId',
    description: 'Unique category ID (UUID)',
    type: String,
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Category retrieved successfully.',
  })
  @ApiNotFoundResponse({
    description: 'Category not found.',
  })
  async findOne(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ): Promise<Category> {
    return this.categoryService.findOne(tenantId, categoryId);
  }

  @Patch(':categoryId')
  @ApiOperation({
    summary: 'Update a category',
    description: 'Updates an existing restaurant menu category.',
  })
  @ApiParam({
    name: 'categoryId',
    description: 'Unique category ID (UUID)',
    type: String,
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Category updated successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid update data.',
  })
  @ApiNotFoundResponse({
    description: 'Category not found.',
  })
  async update(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoryService.update(
      tenantId,
      categoryId,
      dto,
    );
  }

  @Delete(':categoryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a category',
  })
  @ApiParam({
    name: 'categoryId',
    description: 'Unique category ID (UUID)',
    type: String,
    format: 'uuid',
  })
  @ApiNoContentResponse({
    description: 'Category deleted successfully.',
  })
  @ApiNotFoundResponse({
    description: 'Category not found.',
  })
  async remove(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ): Promise<void> {
    return this.categoryService.remove(tenantId, categoryId);
  }
}
