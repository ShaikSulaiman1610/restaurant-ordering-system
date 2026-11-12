
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';

import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
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
}
