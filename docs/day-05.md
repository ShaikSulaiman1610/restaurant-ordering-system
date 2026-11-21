
# Day 05 — Inventory Management Module

## Project
Restaurant Ordering & Menu Management System

## Objective
Implement a multi-tenant Inventory Management Module using
NestJS, TypeScript, PostgreSQL, and TypeORM.

Each restaurant maintains its own inventory records
inside its dedicated PostgreSQL database.

## 1. Inventory Entity

Created:

apps/task-service/src/infrastructure/database/entities/inventory/inventory.entity.ts

Table: inventories

Fields:
- id: UUID primary key
- productId: UUID, unique
- quantity: Integer, default 0
- lowStockThreshold: Integer, default 5
- createdAt: Timestamp
- updatedAt: Timestamp

Relationships:
- One inventory record belongs to one product.
- Each product can have only one inventory record.
- Deleting a product automatically deletes its inventory.

Database constraints:
- quantity >= 0
- lowStockThreshold >= 0
- productId must reference an existing product
- productId must be unique

## 2. Database Migration

Created:

apps/task-service/src/infrastructure/database/migrations/1763790000000-CreateInventories.ts

Migration creates the inventories table with:
- UUID primary key
- Unique product reference
- Foreign key constraint
- Non-negative quantity constraint
- Non-negative threshold constraint
- Creation and update timestamps

Migration successfully executed for:
- restaurant_a_db
- restaurant_b_db

## 3. Tenant Database Integration

Updated:

apps/task-service/src/infrastructure/database/tenant-connection/tenant-connection.service.ts

Registered Inventory entity in tenant database connections.

Updated:

scripts/run-tenant-migrations.ts

Registered the Inventory entity and migration.

Each restaurant uses its own PostgreSQL database.

## 4. Inventory DTOs

Created:

apps/task-service/src/application/inventory/dto/create-inventory.dto.ts

apps/task-service/src/application/inventory/dto/update-inventory.dto.ts

Validation rules:
- productId must be a valid UUID.
- quantity must be an integer.
- quantity cannot be negative.
- lowStockThreshold must be an integer.
- lowStockThreshold cannot be negative.
- lowStockThreshold is optional.

## 5. Inventory Service

Created:

apps/task-service/src/application/inventory/inventory.service.ts

Implemented:
- Create inventory
- Retrieve all inventories
- Retrieve inventory by ID
- Update inventory
- Delete inventory

Business rules:
- Product must exist in the requested restaurant.
- Duplicate inventory records are rejected.
- Missing inventory returns HTTP 404.
- Duplicate inventory returns HTTP 409.
- Invalid product returns HTTP 400.
- Database constraint errors are handled.

## 6. Inventory Controller

Created:

apps/task-service/src/application/inventory/inventory.controller.ts

API endpoints:

POST /tenants/:tenantId/inventories

GET /tenants/:tenantId/inventories

GET /tenants/:tenantId/inventories/:inventoryId

PATCH /tenants/:tenantId/inventories/:inventoryId

DELETE /tenants/:tenantId/inventories/:inventoryId

Successful deletion returns HTTP 204.

## 7. Inventory Module

Created:

apps/task-service/src/application/inventory/inventory.module.ts

Updated:

apps/task-service/src/task-service.module.ts

Registered InventoryModule in the main application.

## 8. Manual API Testing

Restaurant A:
d6570f55-1a96-4f3d-a408-e1f99a49a7c7

Restaurant B:
0f8d16b9-2e6c-43f3-8b44-ae3e07767d4e

Test product:
Chicken 65

Product ID:
901d345d-5c24-4022-945c-77c9032c4bb1

Verified:
- Inventory creation successful
- Retrieve all inventories successful
- Retrieve single inventory successful
- Inventory quantity update successful
- Inventory record deletion verified
- Negative quantity rejected with HTTP 400
- Duplicate inventory rejected with HTTP 409
- Cross-tenant product rejected with HTTP 400

## 9. Unit Testing

Created:

apps/task-service/src/application/inventory/inventory.service.spec.ts

InventoryService unit tests: 17

Test coverage includes:
- Create inventory
- Default low-stock threshold
- Missing product
- Duplicate inventory
- Get all inventories
- Get single inventory
- Missing inventory
- Update quantity
- Update threshold
- Update missing inventory
- Delete inventory
- Delete missing inventory
- Unique constraint error
- Foreign key error
- Check constraint error
- Tenant connection selection
- Separate tenant connections

Inventory unit test result:

Test Suites: 1 passed
Tests: 17 passed

## 10. Full Project Testing

Command:

npx jest --config jest.config.ts --runInBand

Result:

Test Suites: 9 passed, 9 total
Tests: 66 passed, 66 total

All existing project tests passed.

## 11. Build Verification

Command:

nest build task-service

Result:

Rspack compiled successfully.

NestJS application started successfully.

All five Inventory API routes were registered.

## 12. Current Limitations

Inventory quantity can currently be managed through CRUD APIs.

Automatic stock deduction when placing an order
has not yet been implemented.

Low-stock threshold is stored, but a dedicated
low-stock notification endpoint has not been implemented.

## 13. Day 05 Summary

Completed:
- Inventory Entity
- Inventory Migration
- Tenant Database Integration
- Inventory DTOs
- Inventory Service
- Inventory Controller
- Inventory Module
- Manual API Testing
- 17 Inventory Unit Tests
- 66 Passing Project Tests

Next:
Implement the Orders Module and transactional
inventory stock deduction.
