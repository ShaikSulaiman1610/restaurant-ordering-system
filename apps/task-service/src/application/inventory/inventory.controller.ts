
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { Inventory } from '../../infrastructure/database/entities/inventory/inventory.entity';

@Controller('tenants/:tenantId/inventories')
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
  ) {}

  @Post()
  async create(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateInventoryDto,
  ): Promise<Inventory> {
    return this.inventoryService.create(tenantId, dto);
  }

  @Get()
  async findAll(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
  ): Promise<Inventory[]> {
    return this.inventoryService.findAll(tenantId);
  }

  @Get(':inventoryId')
  async findOne(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('inventoryId', ParseUUIDPipe) inventoryId: string,
  ): Promise<Inventory> {
    return this.inventoryService.findOne(tenantId, inventoryId);
  }

  @Patch(':inventoryId')
  async update(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('inventoryId', ParseUUIDPipe) inventoryId: string,
    @Body() dto: UpdateInventoryDto,
  ): Promise<Inventory> {
    return this.inventoryService.update(
      tenantId,
      inventoryId,
      dto,
    );
  }

  @Delete(':inventoryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('inventoryId', ParseUUIDPipe) inventoryId: string,
  ): Promise<void> {
    await this.inventoryService.remove(tenantId, inventoryId);
  }
}
