
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

import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from '../../infrastructure/database/entities/category/category.entity';

@Controller('tenants/:tenantId/categories')
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
  ) {}

  @Post()
  async create(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateCategoryDto,
  ): Promise<Category> {
    return this.categoryService.create(tenantId, dto);
  }

  @Get()
  async findAll(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
  ): Promise<Category[]> {
    return this.categoryService.findAll(tenantId);
  }

  @Get(':categoryId')
  async findOne(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ): Promise<Category> {
    return this.categoryService.findOne(tenantId, categoryId);
  }

  @Patch(':categoryId')
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
  async remove(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ): Promise<void> {
    return this.categoryService.remove(tenantId, categoryId);
  }
}
