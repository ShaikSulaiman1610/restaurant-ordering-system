# Day 01 — Backend Foundation & Multi-Tenant Category Management

**Project:** Restaurant Ordering & Menu Management System  
**Date:** 13 November 2026  
**Status:** Completed  
**Tech Stack:** NestJS, TypeScript, PostgreSQL, TypeORM, Node.js

---

## 1. Day 1 Objective

The objective was to establish the initial backend architecture, implement database-per-tenant isolation, configure tenant-specific PostgreSQL connections, and develop the first working Category REST APIs.

The focus was on building and verifying the foundation before implementing products, modifiers, inventory, orders, and payments.

## 2. Project Structure

The project uses a NestJS monorepo containing:

- `task-service` — Currently hosts tenant-aware Category APIs.
- `inbound-service` — Scaffolded for future development.
- `outbound-service` — Scaffolded for future development.
- `restaurant-ordering-system` — Main application scaffold.
- `libs/shared` — Shared library for reusable functionality.

The Category feature separates controllers, services, DTOs, database entities, and migrations to support maintainability.

## 3. Multi-Tenant Database Architecture

Implemented an initial **database-per-tenant** approach.

| Database | Responsibility |
|---|---|
| `restaurant_registry` | Stores tenant information and database names |
| `restaurant_a_db` | Stores Restaurant A's data |
| `restaurant_b_db` | Stores Restaurant B's data |

The central tenant registry maps tenant identifiers to their respective databases.

### Why database-per-tenant?

Each restaurant's operational data is stored separately, reducing the risk of accidental cross-tenant data access.

### Isolation verification

Created a temporary `isolation_test` table in Restaurant A's database, inserted a test record, and confirmed the table did not exist in Restaurant B's database. The temporary table was subsequently removed.

Later, after creating a category through Restaurant A's API, Restaurant B's Category GET API returned an empty collection.

These checks verified isolation in the tested scenarios. Comprehensive authorization and security testing remain future work.

## 4. Tenant Database Connection Management

Implemented `TenantConnectionService` using TypeORM `DataSource`.

The service:

1. Looks up the tenant in the central registry.
2. Retrieves the associated database name.
3. Initializes a connection pool for the tenant database when needed.
4. Reuses existing initialized connections.
5. Removes failed connection initialization attempts from the cache.
6. Closes initialized connection pools during application shutdown.

### Initial connection pool configuration

| Configuration | Value |
|---|---|
| Tenant pool maximum | 5 connections |
| Registry pool maximum | 10 connections |
| Connection timeout | 5,000 ms |
| Idle timeout | 30,000 ms |

These are initial development settings, not yet validated under production-level load.

## 5. Category Database Design

Created the `Category` entity and a TypeORM migration for the `categories` table.

| Column | Data Type | Purpose |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | VARCHAR(100) | Required category name |
| `description` | VARCHAR(500) | Optional description |
| `createdAt` | TIMESTAMPTZ | Creation timestamp |
| `updatedAt` | TIMESTAMPTZ | Update timestamp |

Added a unique index on the category name to prevent duplicate names within the same tenant database.

Executed the Category migration successfully in both Restaurant A and Restaurant B databases.

## 6. Category REST API Implementation

Implemented the following endpoints:

| Method | Endpoint | Description |
|---|---|---|
| POST | `/tenants/:tenantId/categories` | Create a category |
| GET | `/tenants/:tenantId/categories` | List categories |
| GET | `/tenants/:tenantId/categories/:categoryId` | Get a category by ID |

The Category Service uses the tenant-specific database connection to perform database operations.

Duplicate category name errors are mapped to HTTP `409 Conflict` using PostgreSQL's unique-constraint error code `23505`.

## 7. Request Validation

Installed `class-validator` and `class-transformer`.

Configured NestJS global `ValidationPipe` with:

```typescript
new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});
```

The Create Category DTO enforces:

- Category name must be a non-empty string.
- Category name must not exceed 100 characters.
- Description is optional.
- Description must be a string when supplied.
- Description must not exceed 500 characters.
- Unexpected request fields are rejected.

## 8. API Testing and Results

### Test 1 — Category Creation

**Request:**

```http
POST /tenants/:tenantId/categories
Content-Type: application/json
```

```json
{
  "name": "Starters",
  "description": "Delicious starter dishes"
}
```

**Result:** Successful.

The API returned the new category with an automatically generated UUID and timestamps.

### Test 2 — Tenant Isolation

**Action:** Requested Restaurant B's categories after creating the `Starters` category for Restaurant A.

**Result:** Restaurant B returned an empty collection.

**Status:** Passed.

### Test 3 — Invalid Category Name

**Request:**

```json
{
  "name": "",
  "description": "Invalid category test"
}
```

**Response:**

```json
{
  "message": ["name should not be empty"],
  "error": "Bad Request",
  "statusCode": 400
}
```

**Status:** Passed.

### Test 4 — Application Compilation

**Command:**

```bash
nest build task-service
```

**Result:** Rspack compiled successfully.

**Status:** Passed.

## 9. Challenges and Troubleshooting

### TypeScript migration runner

Encountered decorator execution errors while using `tsx` with TypeORM entities.

Used `ts-node` with compatible compiler options to execute tenant migrations successfully.

### Port 3000 conflict

Encountered `EADDRINUSE` because an earlier task-service process was still listening on port 3000.

Identified the process, stopped the old instance, and restarted the updated server successfully.

### Git repository location

Initially discovered Git was tracking the Windows user directory rather than the project folder.

Initialized a separate Git repository inside `restaurant-ordering-system` and verified that unrelated personal files were not included.

## 10. Version Control

Created the initial local Git commit:

```text
3ff2617 — Day 1: multi-tenant setup and category APIs
```

Renamed the local branch to `main` and successfully pushed the source code to the private GitHub repository.

Environment files, dependencies, and generated build output were excluded through `.gitignore`.

## 11. Day 1 Outcome

Successfully established and tested the initial multi-tenant backend foundation, including:

- Tenant registry and separate PostgreSQL databases.
- Tenant-aware database connection management.
- Category entity and database migrations.
- Category creation and retrieval endpoints.
- DTO-based request validation.
- Basic cross-tenant isolation verification.
- Local version control and GitHub source backup.

## 12. Day 2 Plan

The next development session will focus on:

1. Category update and delete endpoints.
2. Product entity and database migration.
3. Product-to-category relationships.
4. Tenant-aware Product APIs.
5. API validation and testing.

Further development will include modifiers, inventory, orders, simulated payments, Swagger documentation, automated testing, performance optimization, and deployment.

---

**Day 1 Status: Completed**

*This document records implemented functionality and tests actually performed. Features listed in the Day 2 plan are not yet implemented.*