# Architecture

**Analysis Date:** 2026-02-06

## Pattern Overview

**Overall:** Layered monorepo architecture with clear separation between backend API (Midway.js) and frontend (Vue 3), using multi-tenant isolation through "Kits" (套账) as the core organizational pattern.

**Key Characteristics:**
- **Middleware-driven request pipeline** - Order matters (CORS → Report → Auth → Kit)
- **Multi-tenant by design** - All business data scoped to `kit_id` with access control via `user_kits` join table
- **Service-oriented business logic** - Controllers delegate to services; services use TypeORM repositories
- **API versioning** - All endpoints use `/api/v1/` prefix for future compatibility
- **JWT-based authentication** - Tokens contain `userId`, validated in middleware chain
- **Component-driven frontend** - Vue 3 Composition API with Pinia state management

## Layers

**Middleware Layer (Request Entry):**
- Purpose: Request preprocessing, authentication, multi-tenant context extraction
- Location: `apps/backend/src/middleware/`
- Contains: CORS handling, request logging, JWT validation, Kit context extraction
- Depends on: KitService for kit access validation
- Used by: Koa application (executed in strict order)
- Execution order (critical): CorsMiddleware → ReportMiddleware → AuthMiddleware → KitMiddleware

**Controller Layer (HTTP Interface):**
- Purpose: Thin request handling, parameter validation, API documentation
- Location: `apps/backend/src/controller/`
- Contains: Route definitions, DTO validation, response wrapping
- Depends on: Service layer for business logic
- Used by: Koa routing system
- Pattern: Delegates all logic to services; controllers extract `ctx.state.kitId` and pass to services

**Service Layer (Business Logic):**
- Purpose: Core business rules, data transformations, cross-entity operations
- Location: `apps/backend/src/service/`
- Contains: Customer, Contract, Invoice, Payment, Reconciliation, Statistics services
- Depends on: Repositories (TypeORM), other services (with lazy injection to prevent circular deps)
- Used by: Controllers, other services
- Key services: `CustomerService`, `ContractService`, `InvoiceService`, `PaymentService`, `KitService`, `AuthService`
- Pattern: All methods accept `kitId` parameter for data isolation; use `@Provide()` decorator for DI

**Entity/Model Layer (Data Structure):**
- Purpose: TypeORM entity definitions, relationships, database schema
- Location: `apps/backend/src/entity/`
- Contains: Customer, Contract, Invoice, Payment, Kit, User, UserKit, Reconciliation entities
- Depends on: TypeORM decorators
- Used by: Repositories, services
- Pattern: All business entities have `kit_id` foreign key; timestamps via `@CreateDateColumn()` and `@UpdateDateColumn()`

**Repository Layer (Data Access):**
- Purpose: TypeORM repositories for entity-specific queries
- Location: Injected via `@InjectEntityModel(EntityClass)` in services
- Contains: Query builders for complex filters, pagination
- Depends on: TypeORM DataSource
- Used by: Services only
- Pattern: QueryBuilder used for filtered queries (e.g., searching, paginating, aggregations)

**Filter/Error Handling Layer:**
- Purpose: Global exception handling, error normalization
- Location: `apps/backend/src/filter/`
- Contains: DefaultErrorFilter (validation, database, JWT errors), NotFoundFilter
- Depends on: Error types (ValidationError, QueryFailedError, JsonWebTokenError)
- Used by: Koa application
- Pattern: Catches all exceptions; returns standardized `{ success, message, code }` format

**Configuration Layer:**
- Purpose: Environment-specific application settings
- Location: `apps/backend/src/config/`
- Contains: config.default.ts, config.local.ts, config.prod.ts, config.unittest.ts
- Manages: Database, JWT, Redis, CORS, Swagger, upload settings
- Pattern: Values from .env files; NODE_ENV determines which config loads

**Frontend Store Layer (State):**
- Purpose: Global application state (authentication, kit selection)
- Location: `apps/frontend/src/stores/`
- Contains: auth.ts (user, token, logout), kit.ts (current kit, list, switching)
- Uses: Pinia composition API; localStorage for persistence
- Pattern: Each store has setup function returning state, computed properties, and actions

**Frontend API Client Layer:**
- Purpose: Standardized HTTP communication with backend
- Location: `apps/frontend/src/api/`
- Contains: Axios instance with interceptors, per-entity API modules
- Adds: Authorization header (Bearer token), X-Kit-Id header, error handling
- Pattern: Each entity (customer, contract, invoice, etc.) has dedicated API module with CRUD methods

**Frontend View Layer (Pages):**
- Purpose: Routed page components
- Location: `apps/frontend/src/views/`
- Contains: Subdirectories for features (customers, contracts, invoices, payments, etc.)
- Pattern: List views, Create/Edit forms, Detail views; each uses composables and stores

**Frontend Component Layer (Reusables):**
- Purpose: Shared UI components
- Location: `apps/frontend/src/components/`
- Contains: AttachmentList, ContractCard, CustomerSelect, FileUpload, ReportChart, etc.
- Pattern: Presentational components accepting props; no business logic

**Frontend Layout Layer:**
- Purpose: Page structure, navigation, header/sidebar
- Location: `apps/frontend/src/layouts/`
- Contains: MainLayout.vue (header with kit selector, sidebar navigation)
- Pattern: Layout wraps child routes; kit selector and user menu in header

## Data Flow

**Authentication Flow:**

1. User submits credentials (username, password) to `/api/v1/auth/login`
2. AuthController.login() calls AuthService.login() with credentials
3. AuthService validates password with bcrypt, generates JWT token containing `userId`
4. Frontend receives token, stores in auth store and localStorage
5. Subsequent requests include Authorization header: `Bearer <token>`
6. AuthMiddleware validates JWT, extracts userId, sets `ctx.state.user`

**Multi-Tenant Kit Context Flow:**

1. Request arrives with `X-Kit-Id` header (set by frontend Axios interceptor)
2. KitMiddleware extracts `X-Kit-Id` header value
3. If kit_id present: KitService.checkUserKitAccess() validates user has access via `user_kits` table
4. If access valid: sets `ctx.state.kitId`
5. If no kit_id but user authenticated: KitService.getUserDefaultKit() sets default kit
6. Controller receives request, extracts `ctx.state.kitId`, passes to service methods
7. Service methods filter all queries by kit_id (e.g., `WHERE kit_id = :kitId`)

**Request-Response Cycle for Business Operation (e.g., Creating Customer):**

1. Frontend: Form submission calls `createCustomer()` from `api/customer.ts`
2. API Client: Adds Authorization and X-Kit-Id headers via interceptors
3. Backend: POST `/api/v1/customers` arrives
4. Middleware chain: CORS → Report → Auth → Kit (each decorates ctx)
5. Controller: CustomerController.createCustomer() extracts kitId from ctx.state
6. Service: CustomerService.createCustomer(dto, kitId, userId) validates and creates entity
7. Repository: customerRepository.save() inserts with kit_id foreign key
8. Service: Returns saved entity
9. Controller: Wraps response as `{ success: true, data: customer }`
10. Filter: (if error) catches and wraps as `{ success: false, message, code }`
11. Frontend Interceptor: Checks `data.success`, shows error if false, otherwise returns data
12. Frontend: Component updates store, re-renders

**Pagination Flow:**

1. Frontend: Calls `getCustomers({ page: 1, limit: 10, sortBy: 'created_at', sortOrder: 'DESC' })`
2. Service: Creates QueryBuilder, applies WHERE clause for kit_id, applies pagination
3. Database: Returns limited rows + total count
4. Service: Returns `PaginationResult<Customer>` with items, total, page, limit, totalPages
5. Frontend: Displays paginated table, shows page info

## Key Abstractions

**Kit (套账):**
- Purpose: Multi-tenant boundary; each kit isolates a complete set of business data
- Implementation: `Kit` entity with has-many relationship to Customer, Contract, Invoice, Payment
- Access Control: `UserKit` join table defines which users can access which kits
- Pattern: All business entities require `kit_id` foreign key; services enforce kit scoping

**ApiResponse:**
- Purpose: Standardized response envelope for all API endpoints
- Type: `{ success: boolean, data?: T, message?: string, code?: number }`
- Used by: All controllers and error filters
- Pattern: Controllers wrap responses; frontend interceptors check success flag

**DTO (Data Transfer Objects):**
- Purpose: Request body validation, API documentation
- Location: `apps/backend/src/interface.ts`
- Contains: LoginDto, RegisterDto, CreateCustomerDto, UpdateCustomerDto, etc.
- Pattern: Using @ApiProperty decorators for Swagger documentation and @Validate() for runtime validation

**Entity Relationships:**
- Purpose: Type-safe data access through ORM relations
- Examples:
  - Customer.contracts (OneToMany) ↔ Contract.customer (ManyToOne)
  - Contract.invoices (OneToMany) ↔ Invoice.contract (ManyToOne)
  - Invoice.payments (OneToMany) ↔ Payment.invoice (ManyToOne)
  - All scoped by Kit.id (ManyToOne with foreign key)

**QueryBuilder Chains:**
- Purpose: Complex filtered queries maintaining kit isolation
- Examples: `customerRepository.createQueryBuilder('customer').where('customer.kit_id = :kitId', { kitId })`
- Pattern: Always start with kit_id filter, then add domain-specific filters (search, status, etc.)

## Entry Points

**Backend:**
- Location: `apps/backend/bootstrap.js` (production) / `apps/backend/src/configuration.ts` (config)
- Triggers: Node.js process start
- Responsibilities: Load configuration, initialize Midway framework, bind middleware and filters, start Koa server on port 8080
- Configuration: Via `config/` directory loaded in `@Configuration` decorator

**Frontend:**
- Location: `apps/frontend/src/main.ts`
- Triggers: Browser page load (Vite dev server or built HTML)
- Responsibilities: Create Vue app, register plugins (Pinia, Router, Element Plus), mount to #app element
- Initialization: Sets up stores, loads router, applies global styles

**API Versioning:**
- Entry path: `/api/v1/` prefix on all controllers
- Example: `@Controller('/api/v1/customers')`
- Headers: X-API-Version sent by frontend for future multi-version support

**Public Endpoints (no auth required):**
- `/api/v1/auth/*` - Login, register, token refresh
- `/api-docs` - Swagger UI
- `/health/*` - Health checks
- `/` - Root path
- Defined in: `apps/backend/src/middleware/auth.middleware.ts` skipPaths array

**Protected Endpoints (auth required):**
- `/api/v1/customers` - Customer CRUD
- `/api/v1/contracts` - Contract CRUD
- `/api/v1/invoices` - Invoice CRUD
- `/api/v1/payments` - Payment CRUD
- `/api/v1/reconciliations` - Reconciliation operations
- `/api/v1/reports` - Report generation
- `/api/v1/users` - User management
- `/api/v1/kits` - Kit management
- Note: Kit access validated on top of auth (403 if user not in kit)

## Error Handling

**Strategy:** Global exception filter catches all errors; standardizes to ApiResponse format

**Patterns:**

- **Validation Errors:** 400 status, "请求参数验证失败" message
  - Triggered by @Validate() decorator on controller methods with invalid DTO
  - Filter catches ValidationError from Midway validate component

- **Database Errors:** 500 status, "数据库操作失败" message
  - Triggered by TypeORM QueryFailedError (e.g., constraint violations)
  - Filter catches QueryFailedError type

- **Authentication Errors:** 401 status, "token无效或已过期" message
  - Triggered by malformed/expired JWT tokens
  - Filter catches JsonWebTokenError or TokenExpiredError

- **Business Logic Errors:** Message includes entity details
  - Pattern: `throw new Error('客户不存在')` in service
  - Filter detects "不存在" and returns 404

- **Authorization Errors:** 403 status, "您没有访问该套装的权限" message
  - Triggered by KitMiddleware when user lacks kit access
  - Returns before reaching controller

- **Not Found Errors:** 404 status, "请求的资源不存在" message
  - NotFoundFilter catches unmatched routes

- **Production vs Development:** Stack traces included in non-production responses; hidden in production

## Cross-Cutting Concerns

**Logging:**
- Approach: Middleware (ReportMiddleware) logs all requests; filter logs uncaught errors
- Frontend: Console logs API calls and responses (can be disabled)

**Validation:**
- Input validation: @Validate() decorator on controller methods validates DTOs
- Business validation: Services validate state transitions (e.g., contract status progression)
- Kit validation: KitMiddleware validates user kit access

**Authentication:**
- JWT tokens issued at login with `userId` payload
- AuthMiddleware validates token and sets ctx.state.user
- Frontend stores token in localStorage and Pinia store
- Expired tokens trigger redirect to login in API interceptor

**Multi-Tenancy:**
- KitMiddleware extracts and validates kit context
- All business entities have kit_id foreign key
- Services enforce kit_id filtering on all queries
- Frontend Axios interceptor adds X-Kit-Id header to all requests

**API Documentation:**
- Swagger decorators (@ApiTags, @ApiOperation, @ApiBody, @ApiResponse) on all controllers
- Accessible at `/api-docs` endpoint
- Generated from DTOs and controller method signatures

---

*Architecture analysis: 2026-02-06*
