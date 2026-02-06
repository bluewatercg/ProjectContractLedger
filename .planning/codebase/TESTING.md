# Testing Patterns

**Analysis Date:** 2026-02-06

## Test Framework

**Runner:**
- Framework: Jest 29.2.2
- Config: `apps/backend/jest.config.js`
- Preset: `ts-jest` for TypeScript support
- Environment: Node.js
- TypeScript: 4.8.0

**Jest Configuration (`apps/backend/jest.config.js`):**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['<rootDir>/test/fixtures'],
  coveragePathIgnorePatterns: ['<rootDir>/test/'],
};
```

**Assertion Library:**
- Jest built-in `expect` API

**Run Commands:**
```bash
cd apps/backend && yarn test              # Run all tests
cd apps/backend && yarn test --watch      # Watch mode
cd apps/backend && yarn cov               # Coverage report
```

## Test File Organization

**Location:**
- Backend: `apps/backend/test/` directory (co-located with source)
- Alternative test location: `testing/backend/` for API integration tests
- Pattern: Tests in parallel directory structure matching source

**Naming:**
- Pattern: `{feature}.test.ts` or `{feature}.spec.ts`
- Example: `apps/backend/test/controller/home.test.ts`

**Structure:**
```
apps/backend/
├── src/
│   ├── controller/
│   ├── service/
│   ├── entity/
│   └── ...
└── test/
    └── controller/
        └── home.test.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { createApp, close, createHttpRequest } from '@midwayjs/mock';
import { Framework } from '@midwayjs/koa';

describe('test/controller/home.test.ts', () => {

  it('should GET /', async () => {
    // Test implementation
  });

});
```

**Patterns:**

1. **Setup:**
   - Use `createApp<Framework>()` to create test app
   - Tests are async, using `async/await`
   - Midway mock framework handles dependency injection

2. **Teardown:**
   - Call `await close(app)` after each test to clean up
   - Placed in individual tests (not using hooks currently)

3. **Assertion:**
   - Use Jest `expect()` for assertions
   - Check HTTP response: `expect(result.status).toBe(200)`
   - Check response body: `expect(result.text).toBe('Hello Midwayjs!')`

**Full Example from `apps/backend/test/controller/home.test.ts`:**
```typescript
import { createApp, close, createHttpRequest } from '@midwayjs/mock';
import { Framework } from '@midwayjs/koa';

describe('test/controller/home.test.ts', () => {

  it('should GET /', async () => {
    // create app
    const app = await createApp<Framework>();

    // make request
    const result = await createHttpRequest(app).get('/');

    // use expect by jest
    expect(result.status).toBe(200);
    expect(result.text).toBe('Hello Midwayjs!');

    // close app
    await close(app);
  });

});
```

## Mocking

**Framework:** Jest native mocking via `@midwayjs/mock`

**Patterns:**

The codebase uses Midway's mock framework for HTTP testing:
- `createApp()` creates a fully-initialized test application
- `createHttpRequest(app)` creates request builder
- Services are automatically injected via Midway's DI container
- No manual mocking of services is shown in existing tests

**Database Interactions:**
- Tests appear to use real database (configured via `config.unittest.ts`)
- Database state is not explicitly reset between tests in visible tests
- Could use transactions or fixtures for isolation (not currently shown)

**What to Mock:**
- External API calls (Stripe, MinIO, etc.) - not shown in current test files
- Third-party services accessed via HTTP
- Time-dependent operations (if needed)

**What NOT to Mock:**
- Service layer methods (use real services in integration tests)
- Repository methods (use real database or seed data)
- Middleware (Midway app includes middleware)

## Fixtures and Factories

**Test Data:**
No dedicated fixture or factory pattern is visible in current test files. Tests use:
- Direct API calls to seed data
- Inline test data creation
- Database state from initialization

**Location:**
- Configuration: `apps/backend/src/config/config.unittest.ts`
- Could be extended to include fixture directory in `test/fixtures/` (currently excluded from coverage)

**Recommended Pattern (not yet implemented):**
```typescript
// Example factory for test data
const createTestCustomer = (kitId: number, overrides?: Partial<Customer>) => {
  return {
    name: 'Test Customer',
    kit_id: kitId,
    status: 'active',
    ...overrides
  };
};
```

## Coverage

**Requirements:** Not enforced (no threshold specified in jest.config)

**View Coverage:**
```bash
cd apps/backend && yarn cov
```

This generates coverage reports in `coverage/` directory.

**Current Coverage:**
- Not enforced - projects can achieve any coverage level
- Coverage paths ignored: `test/` directory excluded from coverage calculations

## Test Types

**Unit Tests:**
- Scope: Test individual functions/methods in isolation
- Approach: Mock dependencies, focus on input/output
- Not heavily used in current codebase (integration tests more common)
- Would test service methods with mocked repositories

**Integration Tests:**
- Scope: Test controllers with real services and database
- Approach: Use Midway mock app with real dependency injection
- Current implementation: HTTP request tests via `createHttpRequest(app)`
- Validates full request-response cycle

**E2E Tests:**
- Framework: Not used
- Location: None detected
- Could be added using Playwright, Cypress, or Puppt for browser automation

**API Tests:**
- Location: `testing/backend/` directory
- Purpose: Test API endpoints with real running server
- Commands: `yarn test-api`, `yarn test-login`, `yarn performance-test` (from root)

## Common Patterns

**Async Testing:**
```typescript
it('should GET /', async () => {
  const app = await createApp<Framework>();

  const result = await createHttpRequest(app).get('/');

  expect(result.status).toBe(200);

  await close(app);
});
```

- All tests are async
- Use `await` for async operations
- Always cleanup with `await close(app)`

**Error Testing:**
Not shown in current test files. Recommended pattern:

```typescript
it('should return 401 without token', async () => {
  const app = await createApp<Framework>();

  const result = await createHttpRequest(app)
    .get('/api/v1/customers')
    .set('Authorization', '');

  expect(result.status).toBe(401);
  expect(result.body.success).toBe(false);

  await close(app);
});
```

**Request with Body:**
```typescript
it('should create customer', async () => {
  const app = await createApp<Framework>();

  const result = await createHttpRequest(app)
    .post('/api/v1/customers')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Test Customer',
      contact_person: 'John Doe',
      phone: '1234567890'
    });

  expect(result.status).toBe(201);
  expect(result.body.data.id).toBeDefined();

  await close(app);
});
```

## Frontend Testing

**Status:** No tests detected for Vue components

**Recommendation:** Consider adding:
- Component tests using Vitest or Jest with Vue Test Utils
- Unit tests for composables (e.g., `useFormValidation`)
- Mock axios requests in API tests

**Could follow pattern:**
```typescript
import { mount } from '@vue/test-utils';
import CustomerList from '@/views/customers/CustomerList.vue';

describe('CustomerList.vue', () => {
  it('renders customer table', () => {
    const wrapper = mount(CustomerList);
    expect(wrapper.find('.page-title').text()).toBe('客户管理');
  });
});
```

## Test Configuration

**Ignored Paths:**
- `testPathIgnorePatterns`: `['<rootDir>/test/fixtures']` - fixture data not run as tests
- `coveragePathIgnorePatterns`: `['<rootDir>/test/']` - test files excluded from coverage

**Unit Test Config (`apps/backend/src/config/config.unittest.ts`):**
- Specific to test environment (NODE_ENV=unittest)
- Likely includes test database connection

## Database Testing

**Approach:**
- Tests appear to use real database with unittest configuration
- No transaction rollback visible (could cause test data accumulation)
- Database is reinitialized for each test session

**Recommended Enhancement:**
- Add setup/teardown hooks to clear test data
- Use database transactions that rollback after each test
- Seed consistent test data from fixtures

```typescript
describe('CustomerService', () => {
  let app: any;

  beforeEach(async () => {
    app = await createApp<Framework>();
  });

  afterEach(async () => {
    // Clear test data
    // Reset database state
    await close(app);
  });
});
```

## CI/CD Integration

**Commands Available:**
```bash
yarn test              # Run all backend tests
yarn cov               # Generate coverage report
yarn ci                # CI alias (runs cov)
```

**GitHub Actions:** Check `tools/` or `.github/workflows/` for CI configuration (structure not fully explored)

---

*Testing analysis: 2026-02-06*
