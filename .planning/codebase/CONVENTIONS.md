# Coding Conventions

**Analysis Date:** 2026-02-06

## Naming Patterns

**Files:**
- Controllers: `{feature}.controller.ts` (e.g., `customer.controller.ts`, `auth.v2.controller.ts`)
- Services: `{feature}.service.ts` (e.g., `customer.service.ts`, `auth.service.ts`)
- Entities: `{feature}.entity.ts` (e.g., `customer.entity.ts`, `user.entity.ts`)
- Middleware: `{feature}.middleware.ts` (e.g., `auth.middleware.ts`, `kit.middleware.ts`)
- Utilities: `{feature}.util.ts` (e.g., `date.util.ts`)
- Filters: `{feature}.filter.ts` (e.g., `default.filter.ts`, `notfound.filter.ts`)
- API clients: `{feature}.ts` (e.g., `customer.ts`, `auth.ts`)
- Stores: `{feature}.ts` (e.g., `auth.ts`, `kit.ts`)
- Vue components: `PascalCase.vue` (e.g., `CustomerList.vue`, `PaymentForm.vue`)

**Functions/Methods:**
- camelCase for all functions (e.g., `createCustomer`, `getCustomerById`, `handleSearch`)
- Public methods in services: `get*`, `create*`, `update*`, `delete*` (e.g., `getCustomers`, `updateCustomer`)
- Event handlers in Vue: `handle*` (e.g., `handleSearch`, `handleFilter`, `handleDelete`)
- Computed properties: `is*`, `has*`, `get*` (e.g., `isAuthenticated`, `isAdmin`, `disabled`)
- Async operations: use `async/await` consistently

**Variables:**
- camelCase for all variable names
- Prefix store-based state with `ref` or `computed` in Vue Composition API (e.g., `const loading = ref(false)`)
- Database column names: snake_case (e.g., `kit_id`, `contact_person`, `created_at`, `updated_at`)
- Object property names in DTOs: match database columns (e.g., `contact_person`, not `contactPerson`)
- Query parameters: camelCase in code, match API query string format (e.g., `sortBy`, `sortOrder`, `viewAll`)

**Types/Interfaces:**
- PascalCase for class names (e.g., `Customer`, `CustomerService`)
- PascalCase for interface names (e.g., `ApiResponse`, `PaginationQuery`)
- DTO class names: `{Feature}Dto` (e.g., `CreateCustomerDto`, `UpdateCustomerDto`, `LoginDto`)
- Entity class names: `{Feature}` (e.g., `Customer`, `Contract`, `Invoice`)

## Code Style

**Formatting:**
- Tool: Prettier (via mwts for backend)
- Config: `.prettierrc.js` in each app (extends `mwts/.prettierrc.json`)
- Line width: Default Prettier settings (80 chars)
- Indentation: 2 spaces
- Semicolons: Enforced
- Single quotes: Used in TypeScript, double quotes in JSON

**Linting:**
- Backend: ESLint via mwts (`.eslintrc.json`)
- Frontend: ESLint (`.eslintrc.json`) - basic rules, allows console
- Rules for backend extend mwts standard
- Frontend rules:
  - `"no-console": "off"` - console logging allowed
  - `"no-debugger": "warn"` - debugger statements warned
  - `"no-unused-vars": "warn"` - unused variables warned

## Import Organization

**Order:**
1. Node.js/framework core imports (e.g., `from '@midwayjs/decorator'`, `from 'vue'`)
2. External library imports (e.g., `from '@midwayjs/swagger'`, `from 'axios'`)
3. Internal service/entity imports (e.g., `from '../service/customer.service'`)
4. Type imports (e.g., `import type { Customer }` or `from '../interface'`)

**Example from `apps/backend/src/controller/customer.controller.ts`:**
```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Del,
  Body,
  Param,
  Query,
  Inject,
} from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { Validate } from '@midwayjs/validate';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@midwayjs/swagger';
import { CustomerService } from '../service/customer.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  PaginationQuery,
  ApiResponse,
} from '../interface';
```

**Path Aliases:**
- Backend: None detected - uses relative paths
- Frontend: `@/` aliased to `src/` directory (e.g., `from '@/api'`, `from '@/stores/auth'`, `from '@/api/types'`)

## Error Handling

**Patterns:**
- Controllers wrap service calls in try-catch blocks
- Return unified ApiResponse format: `{ success: boolean, data?: T, message?: string, code?: number }`
- Errors include context: message field explains what failed
- Validation errors caught by `@Validate()` decorator
- Middleware errors return HTTP status with body

**Error Response Format:**
```typescript
{
  success: false,
  message: '错误描述',
  code: 400 // HTTP status code
}
```

**Global Error Handling:**
- Backend: `DefaultErrorFilter` in `src/filter/default.filter.ts`
- Catches unhandled errors and logs with `ctx.logger.error()`
- Detects error types (ValidationError, QueryFailedError, JsonWebTokenError)
- Returns stack trace in development, generic message in production
- Frontend: Axios response interceptor handles HTTP errors globally, shows ElMessage toast

**Error Detection by Type:**
- ValidationError → 400 Bad Request
- QueryFailedError → 500 Internal Server Error
- JsonWebTokenError or TokenExpiredError → 401 Unauthorized
- Messages containing '不存在' (doesn't exist) → 404 Not Found

## Logging

**Framework:** `ctx.logger` in Midway (via `@midwayjs/logger`)

**Patterns:**
- Backend middleware logs request timing with `ctx.logger.info()`
- Debug logs prefixed with module name in brackets: `[AuthMiddleware] START - Path:`
- Console.log used for detailed debugging (development only)
- Error logging: `ctx.logger.error('Unhandled error:', err)`
- Frontend: `console.log()` and `console.error()` for debugging, messages show request/response info

**Example from middleware:**
```typescript
console.log('[AuthMiddleware] START - Path:', ctx.path);
console.log('[AuthMiddleware] Token verified, user:', decoded);
console.error('[AuthMiddleware] Token verification failed:', error.message);
```

## Comments

**When to Comment:**
- Class/function header: JSDoc-style blocks explaining purpose and parameters
- Complex business logic: explain "why" not "what"
- Type annotations: preferred over inline comments for clarity

**JSDoc/TSDoc:**
- Used for controllers and services
- Example from `CustomerController`:
```typescript
/**
 * 创建客户
 */
@Post('/')
async createCustomer(@Body() createCustomerDto: CreateCustomerDto): Promise<ApiResponse>
```

- Swagger decorators provide API documentation, reducing need for JSDoc on endpoints

## Function Design

**Size:**
- Controllers: Thin layer, typically 20-40 lines per method
- Services: Business logic concentrated, methods 30-80 lines
- Utilities: Single responsibility, 10-50 lines

**Parameters:**
- Decorated injection preferred over constructor (e.g., `@Inject() customerService: CustomerService`)
- DTOs for request bodies to enable validation
- Query objects for multiple optional parameters
- Context passed implicitly via `@Inject() ctx: Context`

**Return Values:**
- Controllers: Always return `ApiResponse<T>` wrapper
- Services: Return entity objects or null, throw errors for failures
- Utilities: Return processed data or null if invalid
- Async functions: Always return Promise-wrapped types

**Example from `CustomerService`:**
```typescript
async createCustomer(
  createCustomerDto: CreateCustomerDto,
  kitId: number,
  createdBy: number
): Promise<Customer> {
  const customer = this.customerRepository.create({
    ...createCustomerDto,
    kit_id: kitId,
    created_by: createdBy,
  });
  const savedCustomer = await this.customerRepository.save(customer);
  // Clear related cache
  if (this.statisticsService?.invalidateCustomerCache) {
    this.statisticsService.invalidateCustomerCache();
  }
  return savedCustomer;
}
```

## Module Design

**Exports:**
- Controllers: `@Controller()` decorated class, auto-registered
- Services: `@Provide()` decorated class for dependency injection
- Utilities: Export static utility class (e.g., `DateUtil`)
- APIs (frontend): Export object with method properties (e.g., `export const customerApi = { getCustomers(), ... }`)
- Stores (frontend): `defineStore()` returning object with state, computed, and methods

**Barrel Files:**
- Frontend: `src/api/index.ts` exports all API modules
  ```typescript
  export * from './auth';
  export * from './customer';
  // ... other API modules
  ```
- Frontend: `src/stores/index.ts` exports all stores

**Dependency Injection (Backend):**
- Use `@Inject()` for service injection
- Use `@InjectEntityModel(Entity)` for database repositories
- `ctx` injected via `@Inject()` to access request context
- Lazy injection for circular dependencies: `@Inject() serviceName: any`

## API Response Structure

**Success Response:**
```typescript
{
  success: true,
  data: { /* entity or paginated data */ },
  message: '操作成功',
  code?: 200
}
```

**Pagination Response:**
```typescript
{
  success: true,
  data: {
    items: [ /* array of entities */ ],
    total: number,
    page: number,
    limit: number,
    totalPages: number
  },
  message: '获取列表成功'
}
```

**Error Response:**
```typescript
{
  success: false,
  message: '错误描述',
  code: 400 // HTTP status
}
```

## Multi-Tenancy (Kit) Patterns

**Backend:**
- All business entities include `kit_id` column
- Service methods accept optional `kitId` parameter
- Where conditions include `kit_id` filter when kitId provided
- Middleware sets `ctx.state.kitId` after validation
- Controllers extract kitId: `const kitId = this.ctx.state?.kitId;`

**Frontend:**
- API client interceptor adds `X-Kit-Id` header from Pinia store
- Kit selection stored in `useKitStore()`
- Components access current kit: `const kitStore = useKitStore()`
- Query parameters include `viewAll` boolean to override kit filtering

## Database Naming Conventions

**Tables:** snake_case, plural (e.g., `customers`, `contracts`, `invoices`)
**Columns:** snake_case (e.g., `kit_id`, `contact_person`, `created_at`, `updated_at`)
**Foreign Keys:** `{entity}_id` format (e.g., `kit_id`, `customer_id`)
**Timestamps:** `created_at` and `updated_at` on all business entities

---

*Convention analysis: 2026-02-06*
