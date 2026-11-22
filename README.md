# Restaurant Ordering & Menu Management System

A multi-tenant restaurant management backend built with **NestJS, TypeScript, PostgreSQL, and TypeORM**.

The application manages restaurant registration, menu categories, products, modifiers, inventory, orders, and simulated payments.

## 1. Project Status

**Development progress:** Day 13 completed.

**Latest verified results:**
- 154 automated tests passed.
- 18 test suites passed.
- PostgreSQL integration tests passed.
- TypeScript validation passed.
- NestJS application build successful.
- Swagger API documentation verified.

Production deployment and additional security hardening remain future work.

## 2. Technology Stack

| Technology | Purpose |
|---|---|
| NestJS | Backend framework |
| TypeScript | Application development |
| PostgreSQL | Relational database |
| TypeORM | Database access and migrations |
| Jest | Unit and integration testing |
| Swagger | API documentation |
| Cloudinary | Restaurant image storage |
| Git and GitHub | Version control |

## 3. Architecture

The application uses a multi-tenant architecture with a separate PostgreSQL database for each restaurant.

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
Restaurant Registry
    |
    +--------------------+
    |                    |
    v                    v
Restaurant A DB     Restaurant B DB
    |                    |
    v                    v
Restaurant Data      Restaurant Data
```

### Multi-Tenant Design

- A central restaurant registry stores restaurant information and database mappings.
- Each restaurant has its own PostgreSQL database.
- Tenant-aware services resolve the appropriate database connection.
- Tenant databases use TypeORM migrations.
- Database connections are cached for reuse.
- PostgreSQL connection pooling is configured.

Database isolation is implemented, but complete tenant authorization and production security require further review.

## 4. Implemented Features

### Restaurant Management

- Restaurant registration.
- Restaurant information retrieval.
- Automatic tenant database provisioning.
- Database migrations during provisioning.
- Cleanup handling for failed registration.
- Restaurant cover image integration using Cloudinary.

### Category Management

- Create categories.
- Retrieve categories.
- Update categories.
- Delete categories.
- Prevent duplicate category names.
- Validate incoming requests.

### Product Management

- Create and manage restaurant products.
- Associate products with categories.
- Maintain product information and pricing.
- Support tenant-specific product data.

### Modifier Management

- Manage product modifiers.
- Associate modifiers with menu products.
- Support modifier-related ordering functionality.

### Inventory Management

- Track product inventory.
- Validate available stock.
- Update inventory during order processing.
- Restore inventory when eligible orders are cancelled.
- Use database transactions for consistency.

### Order Management

- Create orders.
- Calculate order totals on the server.
- Store order item information.
- Track order status.
- Validate allowed status transitions.
- Prevent invalid cancellation scenarios.
- Protect inventory changes using database transactions.

### Payment Management

- Simulated payment processing.
- Track payment status.
- Handle payment failures.
- Support payment retries.
- Prevent duplicate successful payments.
- Protect payment and cancellation operations against concurrency conflicts.

Payment processing is simulated; no real payment gateway is integrated.

## 5. API Documentation

Swagger UI:

```text
http://localhost:3000/api/docs
```

Swagger JSON:

```text
http://localhost:3000/api/docs-json
```

Documented API groups include:

- Restaurants
- Categories
- Products
- Modifiers
- Inventory
- Orders
- Payments

### Example Payment API Paths

```text
/tenants/{tenantId}/payments
/tenants/{tenantId}/payments/orders/{orderId}
/tenants/{tenantId}/payments/{paymentId}
```

Refer to Swagger for the available HTTP methods, request bodies, parameters, and responses.

## 6. Input Validation

The application uses a global NestJS `ValidationPipe`.

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

This configuration rejects unexpected request properties and enables DTO-based input validation.

An invalid order request containing an unexpected field and an empty items array was verified to return HTTP 400.

## 7. Local Development

### Prerequisites

- Node.js and npm
- PostgreSQL
- Git
- VS Code or another code editor
- Required environment variables and database credentials

### Clone Repository

```bash
git clone https://github.com/ShaikSulaiman1610/restaurant-ordering-system.git
cd restaurant-ordering-system
```

### Install Dependencies

```bash
npm install
```

### Configure Environment

Create a local `.env` file with the PostgreSQL and other required application settings.

Use the actual environment configuration expected by the application.

**Never commit database passwords, Cloudinary credentials, or other secrets.**

### Start Backend

```bash
npx nest start task-service --watch
```

Default local API address:

```text
http://localhost:3000
```

## 8. Testing

### Run Automated Tests

```powershell
npm test -- --runInBand
```

### Run Tests Including PostgreSQL Integration Tests

```powershell
$env:RUN_DB_INTEGRATION_TESTS="true"; npm test -- --runInBand
```

PostgreSQL must be running and configured for integration tests.

### Latest Verified Test Results

```text
Test Suites: 18 passed, 18 total
Tests:       154 passed, 154 total
Snapshots:   0 total
```

### Integration Test Coverage

- Restaurant database provisioning.
- Tenant database migrations.
- Concurrent payment processing.
- Payment and order cancellation race conditions.

Integration tests create temporary PostgreSQL databases and clean them up after execution.

## 9. TypeScript and Build Validation

### TypeScript Check

```powershell
npx tsc --project tsconfig.spec.json --noEmit
```

### NestJS Build

```powershell
npx nest build task-service
```

Latest verified build:

```text
Rspack 2.3.2 compiled successfully in 5.80 s
```

## 10. Database Reliability

The project uses:

- TypeORM entities and migrations.
- PostgreSQL database constraints.
- Database transactions.
- Pessimistic locking where required.
- Tenant-specific database connections.
- Connection pooling.
- Unique constraints to prevent duplicate successful payments.

These mechanisms help maintain consistency during concurrent operations.

## 11. Development Documentation

Detailed development reports are available in the `docs/` directory.

| Day | Documentation |
|---|---|
| 1 | [Day 1](docs/day-01.md) |
| 2 | [Day 2](docs/day-02.md) |
| 3 | [Day 3](docs/day-03.md) |
| 4 | [Day 4](docs/day-04.md) |
| 5 | [Day 5](docs/day-05.md) |
| 6 | [Day 6](docs/day-06.md) |
| 7 | [Day 7](docs/day-07.md) |
| 8 | [Day 8](docs/day-08.md) |
| 9 | [Day 9](docs/day-09.md) |
| 10 | [Day 10](docs/day-10.md) |
| 11 | [Day 11](docs/day-11.md) |
| 12 | [Day 12](docs/day-12.md) |
| 13 | [Day 13](docs/day-13.md) |

## 12. Remaining Work

The following areas require additional implementation, verification, or review:

- Authentication and authorization.
- Production security hardening.
- Rate limiting and CORS review.
- Load and performance testing.
- Production deployment.
- Monitoring and operational readiness.
- Further review of requirements and documentation.

## 13. Repository

**GitHub:** https://github.com/ShaikSulaiman1610/restaurant-ordering-system

**Main branch:** `main`

**Latest verified commit before this README update:** `c7e283b`

---

Built as a backend technical assignment and learning project using NestJS, TypeScript, PostgreSQL, and TypeORM.
