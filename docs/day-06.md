
# Day 6 — Orders Module & Transactional Stock Deduction

## Objective

Implement a multi-tenant Orders Module with automatic inventory deduction and database transactions.

## Features Implemented

- Create customer orders.
- Retrieve all orders for a restaurant.
- Retrieve an order by ID.
- Support multiple products in an order.
- Combine duplicate products into one order item.
- Calculate order totals using integer cents to avoid floating-point errors.
- Automatically deduct inventory when orders are placed.
- Reject orders with insufficient stock.
- Reject unavailable or nonexistent products.
- Use database transactions to keep order creation and inventory updates atomic.
- Use pessimistic database locks to protect inventory during concurrent orders.
- Keep restaurant orders isolated using separate tenant databases.

## Database

Created two tables:

### orders

Stores customer information, total amount, order status, and timestamps.

### order_items

Stores ordered products, quantities, unit prices, and subtotals.

Created and executed the orders migration for both restaurant databases.

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | /tenants/:tenantId/orders | Create order |
| GET | /tenants/:tenantId/orders | List orders |
| GET | /tenants/:tenantId/orders/:orderId | Get order by ID |

## Manual API Testing

Verified:

- Successful order creation.
- Inventory deduction from 50 to 48.
- Insufficient stock returns HTTP 409.
- Failed orders do not create order records.
- Invalid quantity returns HTTP 400.
- Empty order items return HTTP 400.
- Nonexistent product returns HTTP 400.
- Restaurant data isolation.
- Order item records stored correctly in PostgreSQL.

## Automated Testing

Added 15 OrderService Jest unit tests.

Final results:

- Test suites: 10 passed
- Tests: 81 passed
- Failed tests: 0

Jest command:

```powershell
node --experimental-vm-modules ./node_modules/jest/bin/jest.js --runInBand
```

## Build Verification

```powershell
npx nest build task-service
```

Result: Rspack compiled successfully.

## Outcome

The Orders Module supports transactional order creation, automatic inventory deduction, stock validation, and tenant-isolated order retrieval.
