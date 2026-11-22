# Day 09 — Cloudinary Image Management

## Objective

Implement Cloudinary integration for restaurant cover image upload, replacement, and deletion in the Restaurant Ordering & Menu Management System.

## Technologies Used

- NestJS and TypeScript
- Cloudinary SDK
- Multer for multipart file uploads
- PostgreSQL and TypeORM
- Jest for unit testing
- Swagger for API documentation

## Features Implemented

### 1. Cloudinary Integration

Created the following files:

- `apps/task-service/src/infrastructure/cloudinary/cloudinary.module.ts`
- `apps/task-service/src/infrastructure/cloudinary/cloudinary.service.ts`
- `apps/task-service/src/infrastructure/cloudinary/cloudinary.service.spec.ts`

Cloudinary credentials are loaded from environment variables.

### 2. Restaurant Cover Image Upload

**Endpoint:** `POST /restaurants/:id/cover-image`

- Accepts image uploads through multipart/form-data.
- Supports JPEG, PNG, and WebP formats.
- Enforces a maximum file size of 5 MB.
- Uploads images to the `restaurant-ordering/restaurant-covers` Cloudinary folder.
- Stores the image URL and public ID in the restaurant registry database.

### 3. Restaurant Cover Image Deletion

**Endpoint:** `DELETE /restaurants/:id/cover-image`

- Removes the restaurant's cover image from Cloudinary.
- Clears `coverImageUrl` and `coverImagePublicId` in PostgreSQL.

### 4. Image Replacement

When a new cover image is uploaded:

1. The new image is uploaded to Cloudinary.
2. The restaurant's image URL and public ID are updated.
3. The previous image is deleted from Cloudinary.

This behavior was verified using the Cloudinary Media Library.

### 5. Image Validation

The Cloudinary service validates:

- Missing or empty image files
- Unsupported image formats
- Images exceeding 5 MB
- Invalid Cloudinary folder names
- Invalid image public IDs

Upload and deletion failures are handled with appropriate NestJS exceptions.

## Testing

### Unit Tests

Created 13 Cloudinary service unit tests covering image validation, successful uploads, failed uploads, successful deletion, and deletion errors.

Command:

```bash
npm test -- --runInBand cloudinary.service.spec.ts
```

Result: **13 tests passed.**

### Full Test Suite

Command:

```bash
npm test -- --runInBand
```

Results:

- 14 test suites passed
- 121 tests passed
- 3 database integration tests skipped by default
- No failing tests

### TypeScript Validation

Command:

```bash
npx tsc --project tsconfig.spec.json --noEmit
```

Result: **Passed without TypeScript errors.**

### Manual API Testing

Successfully tested:

- Restaurant cover image upload
- Restaurant cover image deletion
- Cover image replacement
- PostgreSQL image metadata updates
- Old image removal from Cloudinary

## Security Considerations

- Cloudinary credentials are stored in `.env`.
- `.env` is excluded from Git using `.gitignore`.
- Uploaded image formats and sizes are restricted.
- Cloudinary public IDs are validated before deletion.
- Cloudinary API failures do not expose credentials to API clients.

## GitHub

Cloudinary implementation commit:

`84b51f1`

Commit message:

`feat: add Cloudinary restaurant cover image upload and deletion`

Successfully pushed to the `main` branch.

## Day 09 Outcome

Cloudinary restaurant cover image management is implemented and manually verified. All 121 enabled tests pass.

## Next — Day 10

Implement simulated payment management, including payment statuses, unique transaction references, payment history, and duplicate payment prevention.