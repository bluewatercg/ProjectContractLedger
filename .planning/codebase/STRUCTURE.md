# Codebase Structure

**Analysis Date:** 2026-02-06

## Directory Layout

```
contract-ledger-midway/
├── apps/
│   ├── backend/                      # Midway.js REST API
│   │   ├── src/
│   │   │   ├── config/              # Environment-specific configs
│   │   │   ├── controller/          # HTTP route handlers
│   │   │   ├── service/             # Business logic
│   │   │   ├── entity/              # TypeORM entities
│   │   │   ├── middleware/          # Request middleware (CORS, Auth, Kit)
│   │   │   ├── filter/              # Exception handlers
│   │   │   ├── utils/               # Utility functions
│   │   │   ├── configuration.ts     # Main Midway config
│   │   │   └── interface.ts         # DTOs and interfaces
│   │   ├── dist/                    # Compiled JavaScript (generated)
│   │   ├── bootstrap.js             # Production entry point
│   │   └── package.json
│   │
│   └── frontend/                     # Vue 3 web application
│       ├── src/
│       │   ├── views/               # Page components (routed)
│       │   │   ├── customers/
│       │   │   ├── contracts/
│       │   │   ├── invoices/
│       │   │   ├── payments/
│       │   │   ├── reconciliations/
│       │   │   ├── reports/
│       │   │   ├── users/
│       │   │   ├── kits/
│       │   │   ├── Dashboard.vue
│       │   │   ├── Login.vue
│       │   │   └── Settings.vue
│       │   ├── components/          # Reusable components
│       │   ├── layouts/             # Layout wrappers
│       │   ├── router/              # Vue Router config
│       │   ├── stores/              # Pinia state stores
│       │   ├── api/                 # API client modules
│       │   ├── composables/         # Reusable logic (Composition API)
│       │   ├── utils/               # Utility functions
│       │   ├── styles/              # Global CSS
│       │   ├── App.vue              # Root component
│       │   └── main.ts              # Entry point
│       ├── dist/                    # Built assets (generated)
│       ├── index.html               # HTML template
│       └── package.json
│
├── database/                        # Database schemas and scripts
│   ├── migrations/                  # TypeORM migrations
│   ├── scripts/                     # Setup and maintenance scripts
│   └── diagrams/                    # Entity relationship diagrams
│
├── docs/                            # Project documentation
│   ├── development/                 # Developer guides
│   ├── deployment/                  # Deployment instructions
│   └── architecture/                # Architecture docs
│
├── tools/                           # Deployment and build tools
│   └── docker/                      # Docker configuration
│
├── testing/                         # Test scripts
│   ├── scripts/                     # API testing scripts
│   └── performance/                 # Performance tests
│
├── scripts/                         # Development scripts
│   ├── dev/                         # Development startup
│   └── utils/                       # Utilities
│
├── .planning/                       # Claude GSD planning docs
│   └── codebase/                    # This analysis
│
├── package.json                     # Root monorepo config
├── CLAUDE.md                        # Claude development guide
└── README.md                        # Project documentation
```

## Directory Purposes

**`apps/backend/src/config/`**
- Purpose: Environment-specific application settings
- Contains: config.default.ts, config.local.ts, config.prod.ts, config.unittest.ts
- Key files:
  - `config.default.ts`: Database, JWT, Redis, CORS, Swagger settings loaded by NODE_ENV
  - `config.local.ts`: Local development overrides
  - `config.prod.ts`: Production-specific settings
- Values: Loaded from .env files and environment variables

**`apps/backend/src/controller/`**
- Purpose: HTTP request handlers and route definitions
- Contains: 16 controller files (auth, customer, contract, invoice, payment, etc.)
- Key files:
  - `auth.controller.ts`: Login/register endpoints
  - `customer.controller.ts`: Customer CRUD
  - `contract.controller.ts`: Contract CRUD
  - `invoice.controller.ts`: Invoice CRUD
  - `payment.controller.ts`: Payment CRUD
  - `reconciliation.controller.ts`: Invoice matching/reconciliation
  - `report.controller.ts`: Report generation
- Pattern: Controllers are thin; delegate business logic to services

**`apps/backend/src/service/`**
- Purpose: Business logic implementation
- Contains: 15 service files
- Key files:
  - `auth.service.ts`: Password hashing, JWT generation
  - `customer.service.ts`: Customer CRUD with filtering
  - `contract.service.ts`: Contract lifecycle management
  - `invoice.service.ts`: Invoice creation, status transitions
  - `payment.service.ts`: Payment recording, reconciliation
  - `kit.service.ts`: Kit access validation, user-kit relationships
  - `reconciliation.service.ts`: Invoice-payment matching logic
  - `statistics.service.ts`: Dashboard metrics computation
  - `report.service.ts`: Report data aggregation
  - `export.service.ts`: Excel/PDF export
- Pattern: All methods accept kitId parameter for data isolation

**`apps/backend/src/entity/`**
- Purpose: TypeORM entity definitions
- Contains: 11 entity files
- Key files:
  - `kit.entity.ts`: Tenant/account boundaries
  - `user.entity.ts`: System users
  - `user-kit.entity.ts`: User-to-Kit access mapping
  - `customer.entity.ts`: Client information
  - `contract.entity.ts`: Contract records
  - `invoice.entity.ts`: Invoice records
  - `payment.entity.ts`: Payment records
  - `reconciliation.entity.ts`: Matching records
  - `reconciliation-detail.entity.ts`: Line items for reconciliation
  - `*-attachment.entity.ts`: File attachments for contracts and invoices
- Pattern: All business entities have kit_id and created_by foreign keys; timestamps via decorators

**`apps/backend/src/middleware/`**
- Purpose: Request preprocessing and context injection
- Contains: 4 middleware files
- Key files:
  - `cors.middleware.ts`: CORS header handling (must be first)
  - `report.middleware.ts`: Request/response logging
  - `auth.middleware.ts`: JWT validation, user context
  - `kit.middleware.ts`: Kit selection and access validation
- Execution order (critical): CORS → Report → Auth → Kit

**`apps/backend/src/filter/`**
- Purpose: Global exception handling
- Contains: 2 filter files
  - `default.filter.ts`: Catches all errors, returns standardized ApiResponse
  - `notfound.filter.ts`: Returns 404 for unmapped routes
- Pattern: Catches by error type (ValidationError, QueryFailedError, JsonWebTokenError)

**`apps/backend/src/utils/`**
- Purpose: Shared utility functions
- Contains: Helper functions for passwords, dates, exports

**`apps/frontend/src/views/`**
- Purpose: Routed page components
- Subdirectories:
  - `customers/`: CustomerList.vue, CustomerForm.vue, CustomerDetail.vue
  - `contracts/`: ContractList.vue, ContractForm.vue, ContractDetail.vue
  - `invoices/`: InvoiceList.vue, InvoiceForm.vue, InvoiceDetail.vue
  - `payments/`: PaymentList.vue, PaymentForm.vue, PaymentDetail.vue
  - `reconciliations/`: ReconciliationList.vue, ReconciliationDetail.vue
  - `reports/`: Various report views
  - `users/`: UserList.vue, UserForm.vue
  - `kits/`: KitList.vue, KitForm.vue
- Pattern: List (searchable, paginated), Create/Edit (form), Detail (readonly view)

**`apps/frontend/src/components/`**
- Purpose: Reusable Vue components
- Contains:
  - Selection components: CustomerSelect.vue, ContractSelect.vue, InvoiceSelect.vue, KitSelect.vue
  - Display: ContractCard.vue, AttachmentList.vue
  - Forms: FileUpload.vue
  - UI: EmptyState.vue, GlobalLoading.vue, SkeletonLoader.vue, SkeletonList.vue
  - Utilities: PrintPreview.vue, SimplePdfViewer.vue
  - Navigation: MobileBottomNav.vue
  - Reports: ReportChart.vue, ReportFilter.vue, ReportTable.vue

**`apps/frontend/src/layouts/`**
- Purpose: Page structure and navigation
- Contains: `MainLayout.vue` (header with kit selector, sidebar menu, main content area)

**`apps/frontend/src/router/`**
- Purpose: Route definitions
- Key file: `index.ts` defines all routes with lazy loading, auth guards, meta tags

**`apps/frontend/src/stores/`**
- Purpose: Pinia global state management
- Key files:
  - `auth.ts`: User info, token, login/logout
  - `kit.ts`: Current kit, kit list, kit switching logic
  - `index.ts`: Store exports

**`apps/frontend/src/api/`**
- Purpose: HTTP client modules
- Contains: One module per entity + shared config
- Key files:
  - `config.ts`: Axios instance with request/response interceptors (adds Authorization, X-Kit-Id headers)
  - `auth.ts`: Login, register, token refresh
  - `customer.ts`: getCustomers, createCustomer, updateCustomer, deleteCustomer
  - `contract.ts`: Contract CRUD operations
  - `invoice.ts`: Invoice CRUD operations
  - `payment.ts`: Payment CRUD operations
  - `reconciliation.ts`: Reconciliation operations
  - `report.ts`: Report generation
  - `types.ts`: TypeScript types for responses
- Pattern: Each module exports named functions, all use shared apiClient with interceptors

**`apps/frontend/src/composables/`**
- Purpose: Reusable Composition API logic
- Contains: Custom hooks for common operations (API calls, validation, etc.)

**`apps/frontend/src/utils/`**
- Purpose: Utility functions
- Contains: Formatters, validators, helpers for dates, currency, etc.

**`apps/frontend/src/styles/`**
- Purpose: Global CSS
- Key files:
  - `design-system.css`: Design tokens (colors, spacing, typography)
  - `element-theme.css`: Element Plus theme customization
  - `index.css`: Global styles
  - `page.css`: Page-specific layouts
  - `animations.css`: Transition/animation classes
  - `print.css`: Print media styles

**`database/migrations/`**
- Purpose: TypeORM schema migrations
- Pattern: File naming: YYYYMMDDHHMMSS-Description.ts

**`database/scripts/`**
- Purpose: Setup and maintenance scripts
- Contains: Index creation, data initialization, connection tests

**`docs/`**
- Purpose: Project documentation
- Contains: Architecture guides, API documentation, deployment guides, troubleshooting

**`tools/docker/`**
- Purpose: Docker containerization
- Contains: Dockerfile, docker-compose.yml for dev, docker-compose.prod.yml for production

**`testing/scripts/`**
- Purpose: API testing
- Contains: test-api.js, test-login.js for manual API verification

**`scripts/dev/`**
- Purpose: Development startup scripts
- Contains: start-dev.sh (Linux/macOS), start-dev.ps1 (PowerShell), start-simple.bat (batch)

## Key File Locations

**Entry Points:**
- `apps/backend/bootstrap.js`: Production backend startup
- `apps/backend/src/configuration.ts`: Midway app configuration, middleware/filter setup
- `apps/frontend/src/main.ts`: Vue app creation, plugin registration
- `apps/frontend/index.html`: HTML template with #app mount point

**Configuration:**
- `apps/backend/src/config/config.default.ts`: Database, JWT, CORS, Redis, Swagger settings
- `apps/backend/.env` or `.env.local`: Environment variables
- `apps/frontend/.env.local`: Frontend environment variables (API base URL, etc.)

**Core Logic:**
- `apps/backend/src/controller/`: All HTTP endpoints
- `apps/backend/src/service/`: All business operations
- `apps/backend/src/entity/`: All data models
- `apps/backend/src/middleware/kit.middleware.ts`: Multi-tenant context (critical)
- `apps/frontend/src/stores/kit.ts`: Frontend kit selection (critical)
- `apps/frontend/src/api/config.ts`: API interceptors (adds headers)

**Testing:**
- `apps/backend/src/config/config.unittest.ts`: Test database config
- `testing/scripts/`: API test runners
- `testing/performance/`: Load testing scripts

## Naming Conventions

**Files:**
- Controllers: `[entity].controller.ts` (e.g., `customer.controller.ts`)
- Services: `[entity].service.ts` (e.g., `customer.service.ts`)
- Entities: `[entity].entity.ts` (e.g., `customer.entity.ts`)
- DTOs/Interfaces: Included in `interface.ts` with class names `Create[Entity]Dto`, `Update[Entity]Dto`
- Views: `[Entity][Action].vue` (e.g., `CustomerList.vue`, `CustomerForm.vue`, `CustomerDetail.vue`)
- Components: PascalCase .vue files (e.g., `CustomerSelect.vue`, `ContractCard.vue`)
- Stores: Kebab-case or camelCase with `use` prefix (e.g., `useAuthStore`, `useKitStore`)
- API modules: Entity names matching backend (e.g., `customer.ts`, `contract.ts`)

**Directories:**
- Feature directories in views: Kebab-case plural (e.g., `customers/`, `contracts/`)
- Utilities: Kebab-case with descriptive names (e.g., `date-utils.ts`)
- CSS modules: Kebab-case (e.g., `design-system.css`)

**Class Names:**
- Controllers: `[Entity]Controller` (e.g., `CustomerController`)
- Services: `[Entity]Service` (e.g., `CustomerService`)
- Entities: `[Entity]` (e.g., `Customer`)
- DTOs: `Create[Entity]Dto`, `Update[Entity]Dto` (e.g., `CreateCustomerDto`)

**Function Names:**
- Backend: camelCase (e.g., `createCustomer`, `getCustomers`, `updateCustomerStatus`)
- Frontend: camelCase (e.g., `handleSubmit`, `fetchCustomers`, `switchKit`)

**Variables:**
- camelCase for all variables and parameters
- Private class properties: underscore prefix optional (convention varies)
- Constant names: UPPER_SNAKE_CASE only for magic values
- kit_id uses snake_case in database columns, camelCase in TypeScript (kitId)

## Where to Add New Code

**New Feature (e.g., New Business Module):**
- Primary code:
  - `apps/backend/src/entity/[feature].entity.ts`: Define data model with kit_id foreign key
  - `apps/backend/src/service/[feature].service.ts`: Business logic with kitId parameter filtering
  - `apps/backend/src/controller/[feature].controller.ts`: HTTP endpoints delegating to service
- Tests:
  - `apps/backend/test/[feature].test.ts`: Service unit tests
- Frontend:
  - `apps/frontend/src/views/[features]/[Feature]List.vue`: List view
  - `apps/frontend/src/views/[features]/[Feature]Form.vue`: Create/edit form
  - `apps/frontend/src/views/[features]/[Feature]Detail.vue`: Detail view
  - `apps/frontend/src/api/[feature].ts`: API client
- Routes:
  - Update `apps/frontend/src/router/index.ts` with new route definitions
- Database:
  - `database/migrations/`: Create migration file if new tables needed

**New Component/Module (within existing feature):**
- Implementation:
  - Reusable component: `apps/frontend/src/components/[ComponentName].vue`
  - Feature-specific: Place in feature directory (e.g., `apps/frontend/src/views/customers/components/`)
- Ensure: Components are presentational; business logic in services/stores

**Utilities:**
- Shared helpers: `apps/backend/src/utils/[utility-name].ts`
- Frontend utilities: `apps/frontend/src/utils/[utility-name].ts`
- Frontend composables: `apps/frontend/src/composables/use-[feature-name].ts`

**Middleware/Filters:**
- New middleware: `apps/backend/src/middleware/[name].middleware.ts`
- Must register in `apps/backend/src/configuration.ts` in `onReady()` method
- New error filter: `apps/backend/src/filter/[name].filter.ts`

**Configuration/Constants:**
- Environment settings: `apps/backend/src/config/config.[env].ts`
- Frontend constants: `apps/frontend/src/api/config.ts` or feature-specific file
- Magic numbers/strings: Define as constants at module top or in config

**API Endpoints:**
- All new endpoints must:
  1. Be under `/api/v1/` prefix
  2. Have @ApiTags and @ApiOperation decorators for Swagger
  3. Accept kitId from `ctx.state.kitId` if business data
  4. Have @Validate() decorator if accepting DTO
  5. Return ApiResponse wrapper: `{ success: true, data: ... }`

## Special Directories

**`apps/backend/dist/`**
- Purpose: Compiled JavaScript output
- Generated: Yes (by `yarn build`)
- Committed: No (.gitignore)
- Contains: Compiled .js files from src/ TypeScript

**`apps/frontend/dist/`**
- Purpose: Built HTML, CSS, JS for production
- Generated: Yes (by `yarn build`)
- Committed: No (.gitignore)
- Contains: Minified assets ready for deployment

**`node_modules/`**
- Purpose: Installed dependencies
- Generated: Yes (by `yarn install`)
- Committed: No (.gitignore)
- Location: Root (monorepo) and in apps/backend, apps/frontend

**`.env` / `.env.local`**
- Purpose: Environment variables (never committed)
- Contains: Database credentials, JWT secret, CORS origins, API URLs
- Committed: No (.gitignore)
- Required for: Local development and Docker deployment

**`database/migrations/`**
- Purpose: TypeORM migration files
- Committed: Yes (version controlled)
- Pattern: YYYYMMDDHHMMSS-DescriptiveName.ts
- Execution: `yarn migration:run` (backend only)

---

*Structure analysis: 2026-02-06*
