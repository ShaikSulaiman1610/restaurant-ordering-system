
# Day 11 — Order Status Management and Cancellation

## Project
Restaurant Ordering & Menu Management System

**Backend:** NestJS, TypeScript  
**Database:** PostgreSQL, TypeORM  
**Architecture:** Multi-tenant (one database per restaurant)

## 1. Objective

Implement a secure order lifecycle with:

- Valid order status transitions
- Invalid transition protection
- Unpaid order cancellation
- Inventory restoration after cancellation
- Double cancellation protection
- Paid order cancellation protection
- Database transactions and row locking
- Automated unit tests

## 2. Order Status Lifecycle

Supported order statuses:

- PENDING
- CONFIRMED
- PREPARING
- COMPLETED
- CANCELLED

Valid transitions:

```text
PENDING
   |
   v
CONFIRMED
   |
   v
PREPARING
   |
   v
COMPLETED
```

Cancellation is allowed from:

```text
PENDING -----> CANCELLED
CONFIRMED --> CANCELLED
```

Cancellation is not allowed from PREPARING, COMPLETED, or CANCELLED.

## 3. Files Added

### Update Order Status DTO

`apps/task-service/src/application/order/dto/update-order-status.dto.ts`

- Uses `@IsEnum(OrderStatus)` for request validation
- Documents allowed enum values in Swagger

### Order Status Unit Tests

`apps/task-service/src/application/order/order-status.service.spec.ts`

- Contains 15 unit tests
- Uses mocked repositories and database transactions

## 4. Files Modified

### Order Service

`apps/task-service/src/application/order/order.service.ts`

Added:

`updateStatus(tenantId, orderId, dto)`

Responsibilities:

1. Connect to the correct restaurant database.
2. Start a database transaction.
3. Lock the order row using `pessimistic_write`.
4. Validate the requested status transition.
5. For cancellation, check whether a successful payment exists.
6. Reject cancellation if the order has already been paid.
7. Retrieve the order items.
8. Lock inventory records before restoring stock.
9. Restore quantities for cancelled unpaid orders.
10. Save the updated order status.

### Order Controller

`apps/task-service/src/application/order/order.controller.ts`

Added a PATCH endpoint for updating order status.

## 5. API Endpoint

**Method:** PATCH

**URL:**

`/tenants/:tenantId/orders/:orderId/status`

**Example request:**

```json
{
  "status": "CONFIRMED"
}
```

**Successful response:** HTTP 200 with the updated order.

**Invalid transition:** HTTP 409 Conflict.

**Missing order:** HTTP 404 Not Found.

**Invalid status:** HTTP 400 Bad Request when request validation is enabled.

## 6. Manual API Testing

Tested the order lifecycle:

```text
PENDING -> CONFIRMED -> PREPARING -> COMPLETED
```

All three transitions succeeded.

Attempted:

```text
COMPLETED -> PENDING
```

Result:

```text
HTTP 409 Conflict
Cannot change order status from COMPLETED to PENDING
```

## 7. Inventory Restoration Test

Product: Chicken 65

| Stage | Stock |
|---|---:|
| Before creating order | 47 |
| After ordering 2 items | 45 |
| After cancelling order | 47 |
| After duplicate cancellation attempt | 47 |

The cancellation restored exactly 2 items.

The duplicate cancellation attempt returned HTTP 409 and did not restore stock again.

## 8. Paid Order Cancellation Test

Attempted to cancel an order with a successful payment.

Result:

```text
HTTP 409 Conflict
Paid orders cannot be cancelled without refund handling
```

Refund processing has not been implemented yet.

## 9. Automated Tests

Created 15 new Order Status Management unit tests covering:

- PENDING to CONFIRMED
- CONFIRMED to PREPARING
- PREPARING to COMPLETED
- Invalid status transitions
- Completed order protection
- Cancelled order protection
- Inventory restoration
- Confirmed unpaid order cancellation
- Paid order cancellation protection
- Missing inventory handling
- Inventory quantity overflow
- Missing order handling
- Pessimistic order locking
- Database transaction usage
- Tenant connection selection

Command:

```powershell
npm test -- --runInBand
```

Results:

```text
Test Suites: 1 skipped, 16 passed, 16 of 17 total
Tests:       3 skipped, 149 passed, 152 total
```

The expected cleanup failure log from an existing RestaurantService mock test does not represent a failing test.

## 10. TypeScript Verification

Command:

```powershell
npx tsc --project tsconfig.spec.json --noEmit
```

Result: Passed without errors.

## 11. Important Interview Concepts

### State Machine

A state machine defines valid transitions between states.

The order lifecycle uses a transition map to prevent invalid changes.

### Database Transaction

A transaction groups related database operations.

For cancellation, inventory restoration and order status update execute within the same transaction.

### Pessimistic Locking

`pessimistic_write` locks selected database rows during a transaction.

It helps prevent concurrent operations from modifying the same record inconsistently.

### Inventory Restoration

When an eligible unpaid order is cancelled, its ordered quantities are added back to inventory.

### Idempotency and Duplicate Protection

An already-cancelled order cannot be cancelled again.

This prevents duplicate inventory restoration.

### Multi-Tenant Isolation

Each restaurant uses its own PostgreSQL database connection.

Order status updates are performed within the requested tenant database.

## 12. Current Limitations

- Refund processing is not implemented.
- Cancellation is blocked after successful payment.
- Concurrent payment/cancellation behavior still needs dedicated integration testing.
- Three existing database integration tests remain skipped by default.

## 13. Day 11 Summary

Implemented and manually verified:

- Order status management
- Valid transition enforcement
- Unpaid cancellation
- Inventory restoration
- Duplicate cancellation protection
- Paid-order cancellation protection

All 149 enabled automated tests passed.

Day 11 implementation and verification completed.
