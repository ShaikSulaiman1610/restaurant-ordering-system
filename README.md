
# Restaurant Ordering & Menu Management System

A multi-tenant restaurant management backend built with **NestJS, TypeScript, PostgreSQL, and TypeORM**.

The system manages restaurant registration, authentication, menu categories, products, modifiers, inventory, orders, and simulated payments.

## 1. Project Status

**Development progress:** Day 16 completed.

**Latest verified results:**
- 157 automated tests passed across 18 test suites.
- PostgreSQL integration tests passed.
- NestJS application build successful.
- JWT authentication and restaurant OWNER membership verified.
- Swagger API documentation available.
- Local API performance benchmark completed.
- PostgreSQL connection pooling configuration reviewed.

Production deployment and complete tenant-level authorization remain future work.

## 2. Technology Stack

| Technology | Purpose |
|---|---|
| NestJS | Backend framework |
| TypeScript | Application development |
| PostgreSQL | Relational database |
| TypeORM | Database access and migrations |
| Jest | Unit and integration testing |
| Swagger | API documentation |
| Cloudinary | Restaurant cover image storage |
| JWT and bcrypt | Authentication and password hashing |
| Node.js | Backend runtime and performance testing |
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
Application Service
    |
    +--------------------+
    |                    |
    v                    v
Registry Database    Tenant Connection Service
                         |
                         v
                 Restaurant Database
```

### Multi-Tenant Design

- A central PostgreSQL registry stores restaurant information, users, and restaurant memberships.
- Each restaurant has a separate PostgreSQL database.
- Tenant-aware services resolve the appropriate database connection.
- Tenant databases use TypeORM migrations.
- Database connections are reused through connection management and pooling.
- Restaurant registration automatically provisions the restaurant database.

Database isolation is implemented, but complete tenant-level authorization requires further work.

## 4. Implemented Features

### Authentication

- User registration.
- Password hashing using bcrypt.
- User login using JWT.
- Protected user profile endpoint.
- JWT-protected restaurant creation.
- Automatic OWNER membership for the restaurant creator.
- Registry transaction for restaurant and OWNER membership creation.

### Restaurant Management

- Register restaurants.
- Retrieve and update restaurant details.
- Automatically provision tenant databases.
- Run migrations during provisioning.
- Handle failed registration cleanup.
- Upload, replace, and delete restaurant cover images using Cloudinary.

### Category Management

- Create, retrieve, update, and delete categories.
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

### Inventory Management

- Track product inventory.
- Validate available stock.
- Update inventory during order processing.
- Restore inventory during eligible cancellations.
- Use database transactions for consistency.

### Order Management

- Create orders containing multiple items.
- Calculate totals on the server.
- Store order item information.
- Track order status.
- Validate status transitions.
- Protect inventory changes using transactions.

### Payment Management

- Simulate payment processing.
- Track payment status.
- Handle failed payments and retries.
- Prevent duplicate successful payments.
- Test concurrent payment and cancellation scenarios.

Payment processing is simulated. No real payment gateway is integrated.

## 5. API Documentation

Swagger UI:

```text
http://localhost:3000/api/docs
```

Swagger JSON:

```text
http://localhost:3000/api/docs-json
```

### Authentication Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a user |
| POST | `/auth/login` | Log in and receive JWT |
| GET | `/auth/me` | Retrieve authenticated user |

### Restaurant Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/restaurants` | Create a restaurant (JWT required) |
| GET | `/restaurants` | List restaurants |
| GET | `/restaurants/{id}` | Get restaurant details |
| PATCH | `/restaurants/{id}` | Update restaurant |
| POST | `/restaurants/{id}/cover-image` | Upload cover image |
| DELETE | `/restaurants/{id}/cover-image` | Delete cover image |

Other API groups include categories, products, modifiers, inventory, orders, and payments.

Refer to Swagger for request DTOs, parameters, and documented responses.

### Example: Register User

```http
POST /auth/register
Content-Type: application/json

{
  "email": "owner@example.com",
  "password": "StrongPassword123!"
}
```

### Example: Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "owner@example.com",
  "password": "StrongPassword123!"
}
```

Successful login returns an `accessToken` and `tokenType`.

### Example: Create Restaurant

```http
POST /restaurants
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "restaurantName": "Example Kitchen",
  "location": "Madurai"
}
```

Successful restaurant creation also creates an OWNER membership for the authenticated user.

## 6. Input Validation

The application uses NestJS DTO validation and a global `ValidationPipe`.

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

This configuration rejects unexpected request properties and supports DTO-based validation.

## 7. Local Development

### Prerequisites

- Node.js and npm
- PostgreSQL
- Git
- Required environment variables
- Cloudinary credentials for image uploads

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

Create a local `.env` file containing the application's required PostgreSQL, JWT, and Cloudinary configuration.

Ensure PostgreSQL is running and the registry database is available.

Never commit `.env`, database passwords, JWT secrets, or Cloudinary credentials.

### Run Registry Migrations

```bash
npx ts-node --project tsconfig.json scripts/run-registry-migrations.ts
```

### Start Backend

```bash
npx nest start task-service --watch
```

Default local API address:

```text
http://localhost:3000
```

Swagger documentation:

```text
http://localhost:3000/api/docs
```

## 8. Testing

### Unit Tests

```powershell
npm test -- --runInBand
```

### PostgreSQL Integration Tests

```powershell
$env:RUN_DB_INTEGRATION_TESTS="true"; npm test -- --runInBand
```

PostgreSQL must be running and correctly configured.

### Latest Verified Results

```text
Test Suites: 18 passed, 18 total
Tests:       157 passed, 157 total
Snapshots:   0 total
```

Test coverage includes:

- Restaurant controllers and services
- Restaurant database provisioning
- Categories and products
- Modifiers and inventory
- Orders and order status
- Simulated payments
- Payment concurrency
- PostgreSQL integration scenarios

## 9. Build Validation

### TypeScript Check

```powershell
npx tsc --project apps/task-service/tsconfig.app.json --noEmit
```

### NestJS Build

```powershell
npx nest build task-service
```

Latest verified build:

```text
Rspack 2.3.2 compiled successfully
```

## 10. PostgreSQL Connection Pooling

The application uses PostgreSQL connection pooling through TypeORM.

| Connection Type | Maximum Pool Size |
|---|---:|
| Registry database | 10 |
| Tenant database | 5 |
| Provisioning initial connection | 1 |
| Provisioning migration connection | 2 |

Configured connection timeout: **5 seconds**.

Configured idle timeout: **30 seconds**.

The minimum pool size is not explicitly configured.

For configuration details, monitoring, capacity planning, and PgBouncer considerations, see:

[PostgreSQL Connection Pooling](docs/connection-pooling.md)

## 11. Performance Testing

A Node.js performance testing script is available at:

`scripts/performance/load-test.mjs`

Run:

```bash
node scripts/performance/load-test.mjs
```

### Recorded Local Benchmark

Endpoint: `GET /restaurants`

| Metric | Result |
|---|---:|
| Total requests | 100 |
| Concurrency | 10 |
| Successful requests | 100 |
| Failed requests | 0 |
| Throughput | 265.17 requests/second |
| Average latency | 31.16 ms |
| P50 latency | 11.84 ms |
| P95 latency | 213.50 ms |
| P99 latency | 251.28 ms |

Full benchmark output:

[Performance Results](docs/performance-results.txt)

These are local development measurements, not production performance guarantees.

## 12. Database Reliability

The project uses:

- PostgreSQL constraints and indexes.
- TypeORM migrations.
- Database transactions.
- Pessimistic locking where required.
- Tenant-specific database connections.
- Connection pooling.
- Unique constraints for payment consistency.
- Registry transactions for restaurant and OWNER membership creation.

These mechanisms help maintain data consistency during concurrent operations.

## 13. Development Documentation

Detailed development reports are available in `docs/`.

- [Day 1](docs/day-01.md)
- [Day 2](docs/day-02.md)
- [Day 3](docs/day-03.md)
- [Day 4](docs/day-04.md)
- [Day 5](docs/day-05.md)
- [Day 6](docs/day-06.md)
- [Day 7](docs/day-07.md)
- [Day 8](docs/day-08.md)
- [Day 9](docs/day-09.md)
- [Day 10](docs/day-10.md)
- [Day 11](docs/day-11.md)
- [Day 12](docs/day-12.md)
- [Day 13](docs/day-13.md)

Additional documentation:

- [Connection Pooling](docs/connection-pooling.md)
- [Performance Results](docs/performance-results.txt)

## 14. Known Limitations and Future Work

- Complete tenant-level authorization and role enforcement.
- Production security hardening.
- Rate limiting and CORS review.
- Production deployment.
- Production monitoring and operational readiness.
- Larger-scale performance and stress testing.

## 15. Repository

GitHub: https://github.com/ShaikSulaiman1610/restaurant-ordering-system

Branch: `main`

---

Built as a backend technical assignment using NestJS, TypeScript, PostgreSQL, and TypeORM.
