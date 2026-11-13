# Day 2 — Restaurant Ordering & Menu Management System

**Date:** 13 November 2026  
**Project:** Restaurant Ordering & Menu Management System  
**Technology:** NestJS, TypeScript, PostgreSQL, TypeORM, Jest, Git & GitHub  
**Today's Focus:** Category UPDATE and DELETE APIs, automated testing, and GitHub version control

---

## 1. Day 2 Objective

Day 1-la namma multi-tenant database architecture and basic Category APIs implement pannom.

Day 2-la existing Category functionality-ah complete panna focus pannom.

**Today's goals:**

1. Category UPDATE API create pannuradhu.
2. Category DELETE API create pannuradhu.
3. Input validation DTO add pannuradhu.
4. API requests PostgreSQL database-la correct-ah work aagudha nu test pannuradhu.
5. Jest automated unit tests create pannuradhu.
6. ESM/Jest testing error solve pannuradhu.
7. Changes GitHub-la upload pannuradhu.

**Result:** PATCH and DELETE API tests successful. 10 Jest unit tests passed. Code GitHub-la push panniyachu.

---

## 2. Project Folder Structure

Day 2-la work panna files:

```text
restaurant-ordering-system/
│
├── apps/
│   └── task-service/
│       └── src/
│           ├── application/
│           │   └── category/
│           │       ├── category.controller.ts
│           │       ├── category.service.ts
│           │       ├── category.service.spec.ts
│           │       └── dto/
│           │           ├── create-category.dto.ts
│           │           └── update-category.dto.ts
│           │
│           └── infrastructure/
│               └── database/
│                   ├── entities/
│                   │   └── category/
│                   │       └── category.entity.ts
│                   └── tenant-connection/
│                       └── tenant-connection.service.ts
│
├── docs/
│   ├── day-01.md
│   └── day-02.md
│
├── jest.config.ts
├── tsconfig.json
├── tsconfig.spec.json
└── package.json
```

### Each file's responsibility

| File | Responsibility |
|---|---|
| `category.controller.ts` | Receives HTTP requests and calls CategoryService |
| `category.service.ts` | Executes category business logic |
| `create-category.dto.ts` | Validates category creation input |
| `update-category.dto.ts` | Validates category update input |
| `category.entity.ts` | Defines the database category structure |
| `tenant-connection.service.ts` | Finds the correct tenant database connection |
| `category.service.spec.ts` | Tests CategoryService methods using Jest |
| `jest.config.ts` | Configures Jest test execution |
| `tsconfig.json` | Configures TypeScript compilation |
| `package.json` | Stores dependencies and project commands |

---

## 3. Category UPDATE API

### Why do we need an UPDATE API?

Example:

Restaurant A already has a category:

```json
{
  "name": "Starters",
  "description": "Delicious starter dishes"
}
```

Restaurant owner wants to change only its name to `Hot Starters`.

Creating a new category would produce another record. Instead, UPDATE modifies the existing record.

We used HTTP `PATCH` because the client can update selected fields without sending every field.

### API endpoint

```http
PATCH /tenants/:tenantId/categories/:categoryId
```

Example request:

```json
{
  "name": "Hot Starters"
}
```

### UPDATE request flow

```text
Client / PowerShell
       |
       | PATCH request
       v
CategoryController
       |
       | update(tenantId, categoryId, dto)
       v
CategoryService
       |
       | getConnection(tenantId)
       v
TenantConnectionService
       |
       | Correct tenant database
       v
TypeORM Repository
       |
       | findOneBy({ id: categoryId })
       v
Existing Category
       |
       | Change provided fields
       v
repository.save(category)
       |
       v
PostgreSQL Database
       |
       v
Updated Category Response
```

### How the controller works

In `category.controller.ts`:

```typescript
@Patch(':categoryId')
async update(
  @Param('tenantId', ParseUUIDPipe) tenantId: string,
  @Param('categoryId', ParseUUIDPipe) categoryId: string,
  @Body() dto: UpdateCategoryDto,
): Promise<Category> {
  return this.categoryService.update(
    tenantId,
    categoryId,
    dto,
  );
}
```

**Explanation:**

- `@Patch(':categoryId')` registers the HTTP PATCH endpoint.
- `@Param('tenantId')` reads the restaurant/tenant identifier from the URL.
- `ParseUUIDPipe` validates that the identifier is a UUID.
- `@Param('categoryId')` reads the category identifier.
- `@Body()` reads the JSON request body.
- `UpdateCategoryDto` describes the allowed update fields and their validation rules.
- `categoryService.update()` sends the data to the Service.
- `Promise<Category>` indicates that the method asynchronously returns a Category.

**Important:** Controller does not directly write SQL queries. It delegates business logic to the Service.

---

## 4. UpdateCategoryDto — Input Validation

**New file:**

```text
apps/task-service/src/application/category/dto/update-category.dto.ts
```

Code:

```typescript
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
```

### Line-by-line explanation

**`import ... from 'class-validator'`**

Imports reusable validation decorators.

**`export class UpdateCategoryDto`**

Defines the structure of a category update request.

**`@IsOptional()`**

The client does not have to provide that field.

**`@IsString()`**

When validated and provided, the field must be a string.

**`@IsNotEmpty()`**

When validated, the name cannot be an empty string.

**`@MaxLength(100)`**

The category name can contain at most 100 characters.

**`name?: string`**

The `?` indicates that the property is optional in TypeScript.

**`@MaxLength(500)`**

The description can contain at most 500 characters.

### Why use DTO validation?

Without validation, a client might send invalid data such as:

```json
{
  "name": 12345
}
```

With a correctly configured NestJS `ValidationPipe`, the request can be rejected before invalid values reach the Service.

**Important technical note:** DTO decorators alone do not automatically validate HTTP requests. A `ValidationPipe` must be configured. Also, `@IsOptional()` skips validation for both `undefined` and `null`; if explicit `null` should be rejected, additional validation is required.

---

## 5. CategoryService — UPDATE Logic

The `update()` method performs the actual business operation.

```typescript
async update(
  tenantId: string,
  categoryId: string,
  dto: UpdateCategoryDto,
): Promise<Category> {
  const dataSource =
    await this.tenantConnectionService.getConnection(tenantId);

  const repository = dataSource.getRepository(Category);

  const category = await repository.findOneBy({
    id: categoryId,
  });

  if (!category) {
    throw new NotFoundException('Category not found');
  }

  if (dto.name !== undefined) {
    category.name = dto.name;
  }

  if (dto.description !== undefined) {
    category.description = dto.description;
  }

  try {
    return await repository.save(category);
  } catch (error) {
    if (
      error instanceof QueryFailedError &&
      (error.driverError as { code?: string }).code === '23505'
    ) {
      throw new ConflictException(
        'Category name already exists',
      );
    }

    throw error;
  }
}
```

### Explanation of each operation

**Step 1: Receive the request information**

`tenantId` identifies the tenant database, `categoryId` identifies the category, and `dto` contains the fields to update.

**Step 2: Get the correct database connection**

```typescript
await this.tenantConnectionService.getConnection(tenantId);
```

This requests the database connection associated with the tenant.

**Step 3: Get the repository**

```typescript
dataSource.getRepository(Category);
```

A TypeORM Repository provides methods to read, create, update, and delete Category records.

**Step 4: Find the existing category**

```typescript
repository.findOneBy({ id: categoryId });
```

This searches the selected tenant database for the given category ID.

**Step 5: Handle a missing category**

```typescript
throw new NotFoundException('Category not found');
```

NestJS converts this exception into HTTP `404 Not Found`.

**Step 6: Update only provided fields**

```typescript
if (dto.name !== undefined) {
  category.name = dto.name;
}
```

If the request provides a name, change it. If the request omits the name, preserve the existing name.

**Step 7: Save changes**

```typescript
repository.save(category);
```

TypeORM persists the updated entity to PostgreSQL.

**Step 8: Handle duplicate category names**

PostgreSQL error code `23505` represents a unique constraint violation.

Our Service converts it into HTTP `409 Conflict`.

### Why is the database unique constraint important?

Two requests might try to create or rename categories to the same name at nearly the same time.

Checking names in application code alone can create a race condition. The database unique constraint provides the final protection.

---

## 6. PATCH API — Real Testing

We tested the existing category using PowerShell.

### Request

```powershell
$body = @{ name = "Hot Starters" } | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://localhost:3000/tenants/d6570f55-1a96-4f3d-a408-e1f99a49a7c7/categories/a8d0c8a7-0552-4f77-8a18-b72144629ca0" `
  -Method Patch `
  -ContentType "application/json" `
  -Body $body
```

### Actual response

```text
id          : a8d0c8a7-0552-4f77-8a18-b72144629ca0
name        : Hot Starters
description : Delicious starter dishes
createdAt   : 2026-11-12T19:19:02.584Z
updatedAt   : 2026-11-13T05:58:45.753Z
```

### What did we verify?

- The category name changed to `Hot Starters`.
- The description remained unchanged.
- The category ID remained the same.
- The `updatedAt` timestamp changed.

**Result: PATCH API manual test passed.**

---

## 7. Category DELETE API

### Why do we need a DELETE API?

A restaurant owner might remove an unwanted category.

We implemented an HTTP DELETE endpoint.

```http
DELETE /tenants/:tenantId/categories/:categoryId
```

### DELETE controller code

```typescript
@Delete(':categoryId')
@HttpCode(HttpStatus.NO_CONTENT)
async remove(
  @Param('tenantId', ParseUUIDPipe) tenantId: string,
  @Param('categoryId', ParseUUIDPipe) categoryId: string,
): Promise<void> {
  return this.categoryService.remove(tenantId, categoryId);
}
```

**Explanation:**

- `@Delete()` registers the DELETE endpoint.
- `@HttpCode(HttpStatus.NO_CONTENT)` sets successful response status to `204`.
- `ParseUUIDPipe` checks the URL identifiers' UUID format.
- `categoryService.remove()` executes the deletion logic.
- `Promise<void>` indicates that no response body is returned on success.

### DELETE service code

```typescript
async remove(
  tenantId: string,
  categoryId: string,
): Promise<void> {
  const dataSource =
    await this.tenantConnectionService.getConnection(tenantId);

  const repository = dataSource.getRepository(Category);

  const result = await repository.delete({
    id: categoryId,
  });

  if (result.affected === 0) {
    throw new NotFoundException('Category not found');
  }
}
```

### DELETE flow

```text
Client
  |
  | DELETE /tenants/:tenantId/categories/:categoryId
  v
CategoryController.remove()
  |
  v
CategoryService.remove()
  |
  v
TenantConnectionService
  |
  v
Correct Tenant Database
  |
  v
TypeORM repository.delete()
  |
  +---- Record deleted ------> 204 No Content
  |
  +---- Record not found ----> 404 Not Found
```

### What is `result.affected`?

It tells us how many database rows were affected by the DELETE operation.

If `affected === 0`, the requested category was not found.

### Important limitation

This is a **hard delete**. The category record is removed from the database.

When Products or Dishes are linked to Categories, deletion behavior must be designed carefully using foreign keys, restrictions, or soft deletion.

---

## 8. DELETE API — Real Testing

We did not delete the existing `Hot Starters` category.

Instead, we created a temporary test category.

### Test category

```text
Name: Delete Test Category

ID: 33b93150-0d96-49a5-8160-2084f03392de
```

### DELETE command

```powershell
Invoke-WebRequest `
  -Uri "http://localhost:3000/tenants/d6570f55-1a96-4f3d-a408-e1f99a49a7c7/categories/33b93150-0d96-49a5-8160-2084f03392de" `
  -Method Delete `
  -UseBasicParsing | Select-Object StatusCode
```

### Actual response

```text
StatusCode
----------
204
```

HTTP `204 No Content` indicates that the DELETE request succeeded.

### Verify deletion using GET

We requested the same category again.

Actual response:

```json
{
  "message": "Category not found",
  "error": "Not Found",
  "statusCode": 404
}
```

This confirms the category was no longer available through the GET endpoint.

**Result: DELETE API manual test passed.**

---

## 9. Automated Testing Using Jest

### What is Jest?

Jest is a JavaScript and TypeScript testing framework.

It allows developers to write tests that check whether application code behaves as expected.

### New test file

```text
apps/task-service/src/application/category/category.service.spec.ts
```

### What is a unit test?

A unit test checks a small piece of application logic independently.

Our tests use a **mock TypeORM Repository** and **mock TenantConnectionService** instead of connecting to a real PostgreSQL database.

### Testing architecture

```text
Jest Test File
      |
      v
CategoryService
      |
      v
Mock TenantConnectionService
      |
      v
Mock DataSource
      |
      v
Mock TypeORM Repository
      |
      v
Jest Assertions
      |
      +---- PASS
      |
      +---- FAIL
```

### Why use mocks?

Mocks allow us to simulate database behavior without actually inserting, updating, or deleting database records.

For example, a mock can simulate a category not being found, so we can verify that the Service throws a `NotFoundException`.

### Important Jest functions

**`describe()`**

Groups related tests.

**`it()`**

Defines an individual test case.

**`expect()`**

Checks an expected result.

**`jest.fn()`**

Creates a mock function.

**`mockResolvedValue()`**

Makes an asynchronous mock return a successful value.

**`mockRejectedValue()`**

Makes an asynchronous mock reject with an error.

**`toThrow()`**

Checks whether an expected exception is thrown.

**`toHaveBeenCalledWith()`**

Checks whether a function was called with the correct arguments.

---

## 10. Our 10 Automated Tests

| No. | Test case | Result |
|---|---|---|
| 1 | Create category successfully | PASS |
| 2 | Retrieve all categories | PASS |
| 3 | Retrieve one category | PASS |
| 4 | Missing category returns 404 | PASS |
| 5 | Update category name | PASS |
| 6 | Update missing category returns 404 | PASS |
| 7 | Duplicate name on update returns 409 | PASS |
| 8 | Delete category successfully | PASS |
| 9 | Delete missing category returns 404 | PASS |
| 10 | Use requested tenant connection | PASS |

### Test execution command

```powershell
npm test -- category.service.spec.ts --runInBand
```

### Actual result

```text
PASS apps/task-service/src/application/category/category.service.spec.ts

Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
Snapshots:   0 total
Time:        2.203 s
```

**Result: 10 out of 10 unit tests passed.**

These tests verify selected CategoryService behaviors, but they do not prove full HTTP validation, real database constraints, concurrency handling, or end-to-end tenant isolation.

---

## 11. Jest ESM Error — Problem and Solution

### Problem

Our first testing command was:

```powershell
npx jest category.service.spec.ts --runInBand
```

The test suite failed before executing any tests.

Error:

```text
Must use import to load ES Module:
node_modules\@nestjs\common\index.js
```

### Why did this happen?

The installed NestJS package uses ES Module syntax.

Our initial Jest invocation did not enable the experimental VM modules support used by this project's test script.

### Configuration files inspected

We checked:

```text
jest.config.ts
tsconfig.spec.json
tsconfig.json
package.json
```

The TypeScript configuration contained:

```json
{
  "module": "nodenext",
  "moduleResolution": "nodenext"
}
```

The `package.json` already contained:

```json
{
  "scripts": {
    "test": "node --experimental-vm-modules ./node_modules/jest/bin/jest.js"
  }
}
```

### Solution

Instead of directly invoking Jest, we used the project's existing npm test script:

```powershell
npm test -- category.service.spec.ts --runInBand
```

This successfully executed all 10 tests.

**Lesson learned:** Before changing project configuration, inspect existing scripts and settings. The project may already provide the correct command.

---

## 12. NestJS Build and Server Testing

### Build command

```powershell
nest build task-service
```

Actual result:

```text
Rspack 2.3.2 compiled successfully in 5.07 s
```

### Server command

```powershell
nest start task-service
```

The NestJS application successfully registered these routes:

```text
POST   /tenants/:tenantId/categories
GET    /tenants/:tenantId/categories
GET    /tenants/:tenantId/categories/:categoryId
PATCH  /tenants/:tenantId/categories/:categoryId
DELETE /tenants/:tenantId/categories/:categoryId
```

### Port conflict handling

When port `3000` was occupied, we checked the running process:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen |
  Select-Object LocalAddress, LocalPort, OwningProcess
```

After confirming the old NestJS process, we stopped it and restarted the updated application.

**Lesson learned:** `EADDRINUSE` means the requested network port is already in use. It does not necessarily indicate a problem with the API code.

---

## 13. Git and GitHub — Day 2

### Modified and created files

```text
category.controller.ts
category.service.ts
category.service.spec.ts
dto/update-category.dto.ts
```

### Stage changes

```powershell
& "C:\Program Files\Git\cmd\git.exe" add apps/task-service/src/application/category/
```

### Commit changes

```powershell
& "C:\Program Files\Git\cmd\git.exe" commit -m "Day 2: implement category update, delete and unit tests"
```

### Actual commit

```text
Commit: 319df31
Files changed: 4
Insertions: 273
```

### Push to GitHub

```powershell
& "C:\Program Files\Git\cmd\git.exe" push
```

Actual result:

```text
13246b1..319df31  main -> main
```

### Repository

https://github.com/ShaikSulaiman1610/restaurant-ordering-system

**Result:** Day 2 source code successfully pushed to the GitHub main branch.

This report file is a separate documentation change and must also be committed and pushed.

---

## 14. Day 2 Complete API Flow

```text
                 REST API Client
                       |
                       v
                NestJS Controller
                       |
            +----------+----------+
            |                     |
            v                     v
       PATCH Request         DELETE Request
            |                     |
            v                     v
      UpdateCategoryDto      UUID Parameters
            |                     |
            v                     v
     CategoryService.update  CategoryService.remove
            |                     |
            +----------+----------+
                       |
                       v
           TenantConnectionService
                       |
                       v
             Correct Tenant Database
                       |
                       v
                TypeORM Repository
                       |
                       v
                 PostgreSQL
                       |
              +--------+--------+
              |                 |
              v                 v
         PATCH Result      DELETE Result
          200 / 404 / 409     204 / 404
```

**Key concept:** The Controller receives the request, the Service performs the business logic, the tenant connection service selects the tenant database, and TypeORM communicates with PostgreSQL.

---

## 15. Important HTTP Status Codes

| Status | Meaning | Our example |
|---|---|---|
| 200 | OK | Category updated |
| 204 | No Content | Category deleted |
| 400 | Bad Request | Invalid input, when validation is enabled |
| 404 | Not Found | Category does not exist |
| 409 | Conflict | Duplicate category name |

---

## 16. What We Learned Today

We practiced several important backend concepts:

- **PATCH:** Update selected fields of an existing resource.
- **DELETE:** Remove a resource.
- **DTO:** Describe and validate request data.
- **Controller:** Handle HTTP routing.
- **Service:** Implement business logic.
- **Repository:** Interact with database entities through TypeORM.
- **Tenant connection:** Select the correct tenant's database.
- **UUID:** Identify resources using unique identifiers.
- **Exceptions:** Return meaningful HTTP errors.
- **Jest:** Automate repeatable tests.
- **Mocking:** Test business logic without a real database.
- **ESM:** Understand JavaScript module loading.
- **Git:** Save code changes in local history.
- **GitHub:** Store and share committed code remotely.

---

## 17. Day 2 Final Status

| Work item | Status |
|---|---|
| UpdateCategoryDto | Completed |
| PATCH Controller and Service | Completed |
| PATCH manual test | Passed |
| DELETE Controller and Service | Completed |
| DELETE manual test | Passed |
| GET verification after DELETE | Passed |
| NestJS build | Passed |
| Jest unit tests | 10/10 Passed |
| Jest ESM execution issue | Resolved using npm test script |
| Git commit | Completed |
| GitHub push | Completed |
| Day 2 report | Drafted; commit and push pending |

---

## 18. Future Improvements

Before calling the Category module production-ready, we should consider:

1. Confirm global `ValidationPipe` configuration and test invalid input.
2. Add unit tests for duplicate category creation and other edge cases.
3. Add real PostgreSQL integration tests.
4. Verify tenant isolation using two actual tenant databases.
5. Test concurrent duplicate-name requests.
6. Design category deletion behavior when Products reference Categories.
7. Add Swagger documentation for PATCH and DELETE endpoints.
8. Review database connection pooling, cleanup, and resource limits.

---

## 19. Interview Revision — Quick Questions

**Q1. Why did we use PATCH instead of POST?**

PATCH updates an existing resource partially. POST is commonly used to create a resource.

**Q2. What does a DTO do?**

A DTO defines the expected request data structure. With a validation pipe, it helps reject invalid input.

**Q3. Why do we use a Service?**

To separate business logic from HTTP request handling.

**Q4. What does a Repository do?**

It provides methods to query and modify database records through TypeORM.

**Q5. Why use a tenant connection service?**

To select the database associated with the requested restaurant or tenant.

**Q6. What is HTTP 204?**

The request succeeded, and the server returns no response body.

**Q7. What is HTTP 404?**

The requested resource was not found.

**Q8. What is HTTP 409?**

The request conflicts with an existing resource or database constraint.

**Q9. What is a Jest mock?**

A simulated dependency used to test code without relying on an actual database or external service.

**Q10. What did we achieve on Day 2?**

We implemented and manually tested Category PATCH and DELETE APIs, passed 10 Jest unit tests, and pushed the source changes to GitHub.

---

**Day 2 Summary:** Category UPDATE and DELETE functionality implemented, verified through API calls, and covered by 10 passing unit tests. Source code committed and pushed successfully. Documentation prepared for revision and interview study.