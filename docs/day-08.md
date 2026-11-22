
# Day 8 — Restaurant Management & Database Provisioning

## Objective

Implement restaurant registration and management with a separate PostgreSQL database for each restaurant.

## Technology Stack

- NestJS
- TypeScript
- PostgreSQL
- TypeORM
- Jest
- Swagger

## Features Implemented

### 1. Restaurant Registration

Endpoint: `POST /restaurants`

Accepts:
- restaurantName
- location

On successful registration:
1. Validates restaurant details.
2. Checks for duplicate name and location.
3. Generates a unique database name using UUID.
4. Creates a separate PostgreSQL database.
5. Runs tenant database migrations.
6. Saves restaurant details in the registry database.

### 2. List Restaurants

Endpoint: `GET /restaurants`

Returns all registered restaurants.

### 3. Get Restaurant by ID

Endpoint: `GET /restaurants/:id`

Returns restaurant details or 404 if not found.

### 4. Update Restaurant

Endpoint: `PATCH /restaurants/:id`

Supports updating:
- restaurantName
- location

### 5. Duplicate Prevention

A PostgreSQL unique index enforces uniqueness for normalized restaurant name and location.

Duplicate registration returns HTTP 409 Conflict.

### 6. Multi-Tenant Database Provisioning

Each newly registered restaurant receives its own PostgreSQL database.

Tenant migrations create:
- categories
- products
- modifiers
- inventories
- orders
- order_items

Provisioning failures trigger cleanup attempts.

### 7. Registry Migration

Added restaurant metadata:
- location
- cover_image_url
- cover_image_public_id
- updated_at

Added a unique index for restaurant name and location.

## API Testing Results

- GET /restaurants — Passed
- POST /restaurants — Passed
- Duplicate registration — 409 Conflict
- PATCH /restaurants/:id — Passed
- GET /restaurants/:id — Passed

## Automated Testing

- 108 unit tests passed across 13 suites.
- 3 database integration tests passed separately.
- NestJS build successful.
- TypeScript compilation successful.

## Test Restaurant

Name: Day8 Test Restaurant

Initial location: Madurai

Updated location: Chennai

The test restaurant and its database remain available for further testing.

## Remaining Work

- Cloudinary cover image upload
- Payment processing and payment history
- Additional concurrency and load testing
- Production hardening of provisioning and cleanup
- Final documentation and deployment

## Conclusion

Restaurant registration, retrieval, updating, duplicate prevention, and automatic tenant database provisioning are implemented and verified through API and automated tests.
