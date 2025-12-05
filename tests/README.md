# SharePoint Migration Tests

This directory contains comprehensive tests for the SharePoint migration, including unit tests, integration tests, and validation scripts.

## Test Structure

```
tests/
├── sharepoint/              # SharePoint library unit tests
│   ├── connection.test.ts   # Client, auth, retry logic tests
│   ├── lists.test.ts        # List CRUD operations tests
│   └── documents.test.ts    # Document operations tests
├── api/                     # API integration tests
│   ├── jobs-sharepoint.test.ts      # Jobs API endpoint tests
│   └── projects-sharepoint.test.ts  # Projects API endpoint tests
└── setup.ts                 # Test configuration and mocks
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test -- --watch
```

### Run Tests with UI
```bash
npm run test:ui
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test tests/sharepoint/connection.test.ts
```

### Run Tests for Specific Suite
```bash
npm test -- --grep "SharePointClient"
```

## Test Categories

### 1. Connection Tests (`tests/sharepoint/connection.test.ts`)

Tests for SharePoint client initialization, authentication, and connectivity:
- Client initialization with environment variables
- Authentication token acquisition and caching
- HTTP method implementations (GET, POST, PATCH, DELETE)
- Retry logic with exponential backoff
- Error handling and parsing
- Throttling and rate limit handling
- File upload/download operations

**Key Test Cases:**
- Token caching and expiration
- Retry on 429/503 errors
- Respect for Retry-After headers
- Proper error wrapping

### 2. Lists Tests (`tests/sharepoint/lists.test.ts`)

Tests for SharePoint list CRUD operations:
- Get items with filtering, sorting, pagination
- Create, update, delete list items
- Batch operations
- Item existence checks
- Count operations
- Complex OData queries

**Key Test Cases:**
- Filter by status, date, custom fields
- Pagination with top/skip
- Batch create/update with partial failures
- Field validation

### 3. Documents Tests (`tests/sharepoint/documents.test.ts`)

Tests for SharePoint document library operations:
- File upload to libraries
- File download with metadata
- Folder creation and management
- Metadata updates
- File existence checks
- Multi-file batch uploads

**Key Test Cases:**
- Upload to nested folders
- Folder path creation
- Metadata setting on upload
- Large file handling

### 4. Jobs API Tests (`tests/api/jobs-sharepoint.test.ts`)

Integration tests for Jobs API endpoints:
- GET /api/get-all-jobs with filters
- POST /api/create-job with validation
- PATCH /api/update-job with status transitions
- DELETE /api/delete-job with permissions
- Batch operations
- Permission checks

**Key Test Cases:**
- Filter by foreman, date, status
- Job type-specific validation
- Status transition rules
- Batch create with partial failures

### 5. Projects API Tests (`tests/api/projects-sharepoint.test.ts`)

Integration tests for Projects API endpoints:
- GET /api/get-projects with filters
- GET /api/get-project by ID
- POST /api/create-project with validation
- PATCH /api/update-project
- PATCH /api/update-project-status with transitions
- Permission checks

**Key Test Cases:**
- Status transition validation (Planning → Active → Completed)
- Budget validation
- Date range validation
- Manager-level permissions

## Validation Scripts

### Connection Test Script

Tests SharePoint connectivity and configuration:

```bash
npx ts-node scripts/test-sharepoint-connection.ts
```

This script validates:
- Environment variables
- Authentication
- List access for all lists (Jobs, Projects, etc.)
- Document library access
- Write permissions
- Query operations
- Batch operations
- Error handling

**Output:** Console report with PASS/FAIL status for each test

### Migration Validation Script

Compares Redis data with SharePoint data:

```bash
npx ts-node scripts/validate-migration.ts
```

This script:
- Compares record counts between Redis and SharePoint
- Identifies missing records in either system
- Checks for field value mismatches
- Generates a detailed JSON report

**Output:**
- Console report with summary statistics
- JSON file in `migration-reports/` directory

## Environment Variables

Ensure these environment variables are set before running tests:

```bash
# SharePoint Configuration
SHAREPOINT_SITE_URL=https://your-tenant.sharepoint.com/sites/your-site
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# Redis Configuration (for migration validation)
KV_REST_API_URL=https://your-redis.upstash.io
KV_REST_API_TOKEN=your-redis-token
```

## Test Coverage Goals

- **Lines:** 70%
- **Functions:** 70%
- **Branches:** 65%
- **Statements:** 70%

Current coverage can be viewed by running:
```bash
npm run test:coverage
```

## Mocking Strategy

Tests use Vitest's mocking capabilities:
- SharePoint client is mocked at the module level
- HTTP responses are mocked with realistic data structures
- Environment variables are set in `tests/setup.ts`
- No actual SharePoint calls are made in unit tests

## Writing New Tests

### Example Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JobsListService } from '@/lib/sharepoint';

vi.mock('@/lib/sharepoint/connection', () => ({
  getSharePointClient: vi.fn(() => mockClient),
}));

describe('My Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do something', async () => {
    // Arrange
    const mockData = { /* ... */ };
    mockClient.get.mockResolvedValue(mockData);

    // Act
    const result = await JobsListService.getItems();

    // Assert
    expect(result).toBeDefined();
    expect(mockClient.get).toHaveBeenCalled();
  });
});
```

## Common Issues

### Issue: Tests fail with "Environment variable not set"
**Solution:** Check that all required environment variables are set in `tests/setup.ts`

### Issue: Tests timeout
**Solution:** Increase timeout in `vitest.config.ts` or for specific tests:
```typescript
it('slow test', async () => { /* ... */ }, { timeout: 10000 });
```

### Issue: Mock not working
**Solution:** Ensure mocks are defined before imports:
```typescript
vi.mock('@/lib/sharepoint', () => ({ /* ... */ }));
import { JobsListService } from '@/lib/sharepoint';
```

## CI/CD Integration

Tests are automatically run in CI/CD pipelines:
- On pull requests
- Before deployment
- Nightly for regression testing

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain coverage above thresholds
4. Update this README if adding new test categories

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [SharePoint REST API Reference](https://docs.microsoft.com/en-us/sharepoint/dev/sp-add-ins/get-to-know-the-sharepoint-rest-service)
- [Testing Library](https://testing-library.com/)
