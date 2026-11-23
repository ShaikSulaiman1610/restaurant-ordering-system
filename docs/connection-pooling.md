
# PostgreSQL Connection Pooling

## Project

Restaurant Ordering & Menu Management System

Backend: NestJS, TypeORM, PostgreSQL

## 1. Overview

The application uses PostgreSQL connection pooling through
TypeORM and the PostgreSQL `pg` driver.

The system follows a multi-tenant architecture:

- A registry database stores restaurant and user information.
- Each restaurant has a separate PostgreSQL database.
- Tenant database connections are managed separately.
- Database connections are reused instead of creating a
  new connection for every API request.

## 2. Connection Pool Configuration

The following settings were verified in the source code.

| Connection Type | Maximum Pool Size |
|---|---:|
| Registry database | 10 |
| Tenant database | 5 |
| Restaurant provisioning - initial connection | 1 |
| Restaurant provisioning - migration connection | 2 |

The payment concurrency integration test uses a pool
maximum of 5 connections.

### Connection Timeouts

The registry, tenant and provisioning configurations use:

- Connection timeout: 5,000 milliseconds
- Idle timeout: 30,000 milliseconds

The minimum pool size is not explicitly configured.

## 3. How Connection Pooling Works

When the application needs a database connection:

1. It requests a connection from the pool.
2. An available connection is reused when possible.
3. The pool can create connections up to its configured
   maximum.
4. When the operation finishes, the connection is
   returned to the pool.
5. Idle connections can be closed after the configured
   idle timeout.

Connection pooling reduces repeated connection setup
overhead.

## 4. Multi-Tenant Considerations

Each restaurant has its own database.

A separate pool for each active tenant can increase
the total number of PostgreSQL connections.

For example, if 20 tenant pools each reach their
maximum of 5 connections, they could collectively
use 100 connections.

This is a theoretical maximum for those tenant pools,
not a measured production connection count.

The registry and provisioning connections must also
be considered when planning total capacity.

## 5. Transactions and Concurrency

The application uses database transactions for
operations requiring consistency.

The project includes payment concurrency integration
tests against PostgreSQL.

Restaurant registration also uses a registry database
transaction to save the restaurant record and its
OWNER membership together.

The restaurant-specific database is provisioned
separately, with cleanup handling for registration
failures.

## 6. Monitoring

In PostgreSQL, active database connections can be
inspected using:

```sql
SELECT
  datname,
  state,
  COUNT(*) AS connection_count
FROM pg_stat_activity
GROUP BY datname, state
ORDER BY datname, state;
```

Useful monitoring metrics include:

- Total active and idle connections
- Connection acquisition wait time
- Connection timeout errors
- Query latency
- Database CPU and memory usage

## 7. Scaling Strategy

For higher traffic:

1. Measure real connection usage under load.
2. Tune pool maximum sizes based on available
   PostgreSQL connections.
3. Avoid keeping unused tenant pools open indefinitely.
4. Consider PgBouncer for external connection pooling.
5. Monitor connection wait times and database performance.
6. Repeat performance tests after configuration changes.

PgBouncer is a recommended future scaling option.
It is not claimed to be deployed in this project.

## 8. Performance Testing

A local performance testing script is available at:

`scripts/performance/load-test.mjs`

Run it using:

```bash
node scripts/performance/load-test.mjs
```

Recorded benchmark output is available in:

`docs/performance-results.txt`

The benchmark sends 100 GET requests to `/restaurants`
with a concurrency level of 10.

These results describe a local test environment and
should not be interpreted as production capacity.

## 9. Source Files

- `apps/task-service/src/task-service.module.ts`
- `apps/task-service/src/infrastructure/database/tenant-connection/tenant-connection.service.ts`
- `apps/task-service/src/application/restaurant/restaurant-provisioning.service.ts`
- `apps/task-service/src/application/payment/payment-concurrency.integration.spec.ts`
