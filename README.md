# 🍽️ Restaurant Ordering & Menu Management System

A backend application built with **NestJS, TypeScript, PostgreSQL, and TypeORM** for managing restaurant menus, categories, products, inventory, orders, and payments.

The project is being developed incrementally, with an emphasis on clean architecture, tenant data isolation, database reliability, automated testing, and scalability.

**Project Status:** In active development

## 1. Technology Stack

| Technology | Purpose |
|---|---|
| NestJS | Backend framework |
| TypeScript | Type-safe application development |
| PostgreSQL | Relational database |
| TypeORM | Database entities and queries |
| Jest | Automated unit testing |
| PowerShell | Local API testing |
| Git | Source version control |
| GitHub | Remote source repository |

## 2. Project Architecture

The project uses a multi-application NestJS workspace and a tenant-aware database connection design.

```text
                    HTTP Client
                         |
                         v
                  NestJS Controller
                         |
                         v
                   Business Service
                         |
                         v
                TenantConnectionService
                         |
                         v
                  Tenant Registry
                         |
                +--------+--------+
                |                 |
                v                 v
        Restaurant A DB    Restaurant B DB
                |                 |
                v                 v
          Categories          Categories
```

**Architecture goal:** Each restaurant's data should remain isolated from other restaurants.

Tenant database selection is implemented as part of the current foundation. Full multi-tenant security and concurrency verification remain future work.

## 3. Current Features

### Category Management

The Category module currently supports:

- Create a category
- Retrieve all categories
- Retrieve a category by ID
- Update an existing category
- Delete a category
- Detect duplicate category names using PostgreSQL uniqueness constraints
- Return appropriate HTTP errors for missing or conflicting categories
- Select tenant database connections through `TenantConnectionService`

### Category API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/tenants/:tenantId/categories` | Create category |
| GET | `/tenants/:tenantId/categories` | List categories |
| GET | `/tenants/:tenantId/categories/:categoryId` | Retrieve category |
| PATCH | `/tenants/:tenantId/categories/:categoryId` | Update category |
| DELETE | `/tenants/:tenantId/categories/:categoryId` | Delete category |

### Example PATCH Request

```http
PATCH /tenants/{tenantId}/categories/{categoryId}
Content-Type: application/json
```

```json
{
  "name": "Hot Starters"
}
```

### Example DELETE Response

```text
HTTP/1.1 204 No Content
```

A subsequent GET for the deleted category returns:

```json
{
  "message": "Category not found",
  "error": "Not Found",
  "statusCode": 404
}
```

## 4. Project Folder Structure

```text
restaurant-ordering-system/
|
├── apps/
│   ├── restaurant-ordering-system/
│   ├── task-service/
│   │   └── src/
│   │       ├── application/
│   │       │   └── category/
│   │       │       ├── category.controller.ts
│   │       │       ├── category.service.ts
│   │       │       ├── category.service.spec.ts
│   │       │       └── dto/
│   │       │           ├── create-category.dto.ts
│   │       │           └── update-category.dto.ts
│   │       └── infrastructure/
│   │           └── database/
│   │               ├── entities/
│   │               └── tenant-connection/
│   ├── inbound-service/
│   └── outbound-service/
|
├── libs/
│   └── shared/
|
├── docs/
│   ├── day-01.md
│   └── day-02.md
|
├── package.json
├── tsconfig.json
├── jest.config.ts
└── README.md
```

### Important Files

| File | Responsibility |
|---|---|
| `main.ts` | Starts the NestJS application |
| `category.controller.ts` | Handles category HTTP requests |
| `category.service.ts` | Executes category business logic |
| `create-category.dto.ts` | Defines category creation input |
| `update-category.dto.ts` | Defines category update input |
| `category.entity.ts` | Maps Category data to PostgreSQL |
| `tenant-connection.service.ts` | Resolves the requested tenant database connection |
| `category.service.spec.ts` | Tests CategoryService using Jest |
| `docs/day-01.md` | Day 1 development notes |
| `docs/day-02.md` | Day 2 development notes |

## 5. Local Development Setup

### Prerequisites

- Node.js and npm
- PostgreSQL
- Git
- VS Code or another code editor
- Database configuration for the tenant registry and tenant databases

### Clone the Repository

```bash
git clone https://github.com/ShaikSulaiman1610/restaurant-ordering-system.git
cd restaurant-ordering-system
```

### Install Dependencies

```bash
npm install
```

### Configure Databases

Configure the required PostgreSQL connections according to the application's database configuration.

The tenant registry must contain the tenant-to-database mapping, and tenant databases must have the required schema or migrations applied.

Database credentials and secrets must not be committed to GitHub.

### Build the Task Service

```bash
npx nest build task-service
```

### Start the Task Service

```bash
npx nest start task-service
```

The service has been tested locally using:

```text
http://localhost:3000
```

## 6. Testing

### Jest Unit Tests

Run the CategoryService unit tests:

```bash
npm test -- category.service.spec.ts --runInBand
```

### Verified Test Result

```text
Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
```

The passing tests cover category creation, retrieval, updating, deletion, duplicate-name handling during updates, missing-category errors, and tenant connection selection.

These are unit tests using mocked dependencies. Real PostgreSQL integration tests, concurrency tests, and full tenant-isolation tests are planned.

## 7. HTTP Status Codes

| Status | Meaning |
|---|---|
| 200 | Successful retrieval or update |
| 204 | Successful deletion without response body |
| 400 | Invalid request |
| 404 | Category not found |
| 409 | Duplicate category name conflict |

## 8. Development Progress

### Day 1 — Initial Foundation

- NestJS multi-application project setup
- PostgreSQL and TypeORM integration
- Tenant registry and tenant-aware database connection foundation
- Category entity and initial APIs
- Git and GitHub repository setup
- Development report created

[Read Day 1 Report](docs/day-01.md)

### Day 2 — Category CRUD and Testing

- Implemented Category PATCH endpoint
- Implemented Category DELETE endpoint
- Added UpdateCategoryDto
- Verified PATCH behavior using PowerShell
- Verified DELETE response `204`
- Verified deleted category returns `404`
- Created Jest CategoryService unit tests
- Successfully executed 10 unit tests
- Committed and pushed code to GitHub
- Created detailed Day 2 documentation

[Read Day 2 Report](docs/day-02.md)

## 9. Planned Features

The following features are planned and are **not yet marked complete**:

- Product and dish management
- Category–product relationships
- Modifiers and modifier groups
- Inventory tracking and availability
- Restaurant management
- Order creation and server-side total calculation
- Order item price snapshots
- Idempotent order processing
- Simulated payment processing and transaction history
- Cloudinary image uploads
- Swagger API documentation
- Connection pool configuration and monitoring
- Database indexing and query optimization
- Concurrent request testing
- Load and performance testing
- Production deployment

## 10. Engineering Priorities

This project aims to demonstrate:

1. Separation of Controllers, Services, and database responsibilities.
2. Tenant-aware data access and isolation.
3. Database-level uniqueness and consistency.
4. Correct validation and error handling.
5. Automated testing.
6. Safe concurrency and transaction handling.
7. Efficient PostgreSQL connection management.
8. Clear documentation and maintainable code.

These are development goals; some require further implementation and verification.

## 11. Documentation

Detailed development notes are available in the `docs/` folder:

- [Day 1 — Initial Setup](docs/day-01.md)
- [Day 2 — Category Update, Delete and Jest Testing](docs/day-02.md)

## 12. Repository

**GitHub:** https://github.com/ShaikSulaiman1610/restaurant-ordering-system

**Current branch:** `main`

**Development status:** Active

---

Built as a backend technical assignment and hands-on learning project using NestJS, TypeScript, PostgreSQL, and TypeORM.