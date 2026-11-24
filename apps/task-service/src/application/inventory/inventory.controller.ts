
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

import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { InventoryService } from './inventory.service.js';
import { CreateInventoryDto } from './dto/create-inventory.dto.js';
import { UpdateInventoryDto } from './dto/update-inventory.dto.js';
import { Inventory } from '../../infrastructure/database/entities/inventory/inventory.entity.js';

@ApiTags('Inventory')
@ApiParam({
  name: 'tenantId',
  description: 'Unique restaurant ID (UUID)',
  type: String,
  format: 'uuid',
})
@Controller('tenants/:tenantId/inventories')
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create inventory for a product',
    description:
      'Creates an inventory record for a product belonging to the specified restaurant.',
  })
  @ApiCreatedResponse({
    description: 'Inventory created successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid inventory data or restaurant ID.',
  })
  @ApiConflictResponse({
    description: 'Inventory already exists or conflicts with another record.',
  })
  async create(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateInventoryDto,
  ): Promise<Inventory> {
    return this.inventoryService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all inventory records',
    description:
      'Returns inventory records for the specified restaurant.',
  })
  @ApiOkResponse({
    description: 'Inventory records retrieved successfully.',
  })
  async findAll(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
  ): Promise<Inventory[]> {
    return this.inventoryService.findAll(tenantId);
  }

  @Get(':inventoryId')
  @ApiOperation({
    summary: 'Get inventory by ID',
  })
  @ApiParam({
    name: 'inventoryId',
    description: 'Unique inventory ID (UUID)',
    type: String,
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Inventory retrieved successfully.',
  })
  @ApiNotFoundResponse({
    description: 'Inventory record not found.',
  })
  async findOne(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('inventoryId', ParseUUIDPipe) inventoryId: string,
  ): Promise<Inventory> {
    return this.inventoryService.findOne(tenantId, inventoryId);
  }

  @Patch(':inventoryId')
  @ApiOperation({
    summary: 'Update inventory',
    description:
      'Updates an existing inventory record for the specified restaurant.',
  })
  @ApiParam({
    name: 'inventoryId',
    description: 'Unique inventory ID (UUID)',
    type: String,
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Inventory updated successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid inventory update data.',
  })
  @ApiNotFoundResponse({
    description: 'Inventory record not found.',
  })
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
  @ApiOperation({
    summary: 'Delete inventory',
  })
  @ApiParam({
    name: 'inventoryId',
    description: 'Unique inventory ID (UUID)',
    type: String,
    format: 'uuid',
  })
  @ApiNoContentResponse({
    description: 'Inventory deleted successfully.',
  })
  @ApiNotFoundResponse({
    description: 'Inventory record not found.',
  })
  @ApiConflictResponse({
    description:
      'Inventory cannot be deleted because related records exist.',
  })
  async remove(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('inventoryId', ParseUUIDPipe) inventoryId: string,
  ): Promise<void> {
    await this.inventoryService.remove(tenantId, inventoryId);
  }
}
