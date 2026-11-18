
# Day 3 — Product Management Module

## 1. Objective

Day 3 focused on implementing Product CRUD APIs for the multi-tenant Restaurant Ordering & Menu Management System.

Each restaurant has a separate PostgreSQL database.

## 2. Technology Stack

- NestJS 12
- TypeScript
- PostgreSQL
- TypeORM
- Jest
- PowerShell
- Git and GitHub

## 3. Product Entity

File:
`apps/task-service/src/infrastructure/database/entities/product/product.entity.ts`

The Product entity contains:

- id — UUID primary key
- name — Product name
- description — Optional description
- price — Decimal value
- categoryId — Related category UUID
- isAvailable — Availability status
- imageUrl — Optional image URL
- createdAt — Creation timestamp
- updatedAt — Modification timestamp

Products belong to Categories using a many-to-one relationship.

## 4. Product Database Migration

File:
`1763530000000-CreateProducts.ts`

The migration creates the products table with:

- Primary key
- Foreign key referencing categories
- Category index
- Price CHECK constraint
- Timestamps

The migration was executed successfully for:

- restaurant_a_db
- restaurant_b_db

## 5. Product CRUD APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /tenants/:tenantId/products | Create product |
| GET | /tenants/:tenantId/products | List products |
| GET | /tenants/:tenantId/products/:productId | Get product |
| PATCH | /tenants/:tenantId/products/:productId | Update product |
| DELETE | /tenants/:tenantId/products/:productId | Delete product |

DELETE returns HTTP 204 on success.

## 6. Product DTO Validation

CreateProductDto and UpdateProductDto validate:

- Product name
- Description length
- Positive price
- Maximum two decimal places
- Category UUID
- Availability boolean
- Optional image URL

Zero price and negative price are rejected.

Verified response for price "0.00":

```json
{
  "message": [
    "price must be greater than zero with at most 2 decimal places"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

## 7. ProductService

ProductService handles:

- Product creation
- Product listing
- Product retrieval
- Product updates
- Product deletion
- Category existence validation
- Database error handling
- Tenant-specific database selection

PostgreSQL error handling:

| Code | Meaning | HTTP response |
|---|---|---|
| 23503 | Foreign key violation | 400 |
| 23505 | Unique constraint violation | 409 |
| 23514 | Check constraint violation | 400 |

## 8. Multi-Tenant Isolation

TenantConnectionService selects the database associated with the tenantId.

Restaurant A uses restaurant_a_db.

Restaurant B uses restaurant_b_db.

A product created in Restaurant A was not accessible through Restaurant B's product endpoint.

The cross-tenant GET request returned HTTP 404.

## 9. Manual API Testing

Verified successfully:

- Create product
- List products
- Get product by ID
- Update product price
- Delete product
- Get deleted product returns 404
- Invalid category returns 400
- Negative price returns 400
- Zero price returns 400
- Missing name returns 400
- Cross-tenant product lookup returns 404

## 10. Automated Testing

File:
`apps/task-service/src/application/product/product.service.spec.ts`

Implemented 17 ProductService unit tests.

The tests cover:

- CRUD operations
- Missing products
- Category validation
- Price updates
- Availability updates
- Database error handling
- Tenant connection selection
- Mocked tenant separation

ProductService result:

17 tests passed.

## 11. Full Project Test Suite

Command:

```powershell
$env:NODE_OPTIONS="--experimental-vm-modules"; npx jest --config jest.config.ts --runInBand
```

Actual result:

```text
Test Suites: 7 passed, 7 total
Tests:       32 passed, 32 total
```

All existing project tests passed.

## 12. Issues Resolved

### Port 3000 conflict

Error: EADDRINUSE

Resolved by identifying and stopping the old server process.

### Jest ESM compatibility

Enabled experimental VM modules for Jest.

### Controller test dependency injection

Mocked TaskServiceService and TenantConnectionService.

### Product price validation

Updated DTO validation to reject zero and negative prices.

## 13. Build Verification

Command:

```powershell
nest build task-service
```

Result:

Rspack compiled successfully.

## 14. Files Created or Modified

- Product entity
- Product migration
- Product controller
- Product service
- Product module
- CreateProductDto
- UpdateProductDto
- ProductService unit tests
- Tenant connection service
- Tenant migration script
- TaskServiceModule
- TaskServiceController unit test

## 15. Day 3 Status

| Task | Result |
|---|---|
| Product Entity | Completed |
| Product Migration | Completed |
| Product CRUD | Completed |
| DTO Validation | Passed |
| Tenant Isolation Manual Test | Passed |
| Product Unit Tests | 17/17 Passed |
| Full Jest Suite | 32/32 Passed |
| NestJS Build | Passed |
| GitHub Push | Pending |

## 16. Next Steps

- Commit and push Day 3 changes
- Implement Modifiers Module
- Implement Inventory Module
- Implement Orders Module
- Add Swagger documentation
- Add integration and performance tests

## 17. Important Notes

Unit tests use mocked database connections and do not replace real PostgreSQL integration tests.

The temporary tenant connection test endpoint must be removed before production deployment.

Product and Category modules require additional production hardening before deployment.

---

Day 3 Summary: Product CRUD implemented, database migrations applied to two tenants, validation and tenant isolation manually verified, and all 32 project tests passed.
