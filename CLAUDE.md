# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ProjectContractLedger is an enterprise-level contract management system built with Midway.js (backend) and Vue 3 (frontend) in a monorepo structure. The system manages the complete contract lifecycle including customers, contracts, invoices, payments, and reconciliations, with multi-tenant support through "Kits" (套账).

## Development Commands

### Installation & Setup
```bash
# Install all dependencies (both frontend and backend)
yarn install-all

# Or install separately
cd apps/backend && yarn install
cd apps/frontend && yarn install
```

### Development Servers
```bash
# Start both frontend and backend (recommended)
# Windows PowerShell
yarn start-ps

# Linux/macOS
yarn start-sh

# Windows batch script
yarn dev

# Start individually
cd apps/backend && yarn dev    # Backend on port 8080
cd apps/frontend && yarn dev   # Frontend on port 8000
```

### Build & Production
```bash
# Build all
yarn build-all

# Build individually
cd apps/backend && yarn build
cd apps/frontend && yarn build

# Start production backend
cd apps/backend && yarn start
```

### Testing
```bash
# Backend tests
cd apps/backend && yarn test

# API testing scripts
yarn test-api          # Test all APIs
yarn test-login        # Test login functionality
yarn performance-test  # Run performance tests
```

### Database Management
```bash
# Apply database indexes
yarn apply-indexes

# Test database connection
yarn test-db

# View database info
yarn db-info
```

### Code Quality
```bash
# Backend linting
cd apps/backend && yarn lint        # Check
cd apps/backend && yarn lint:fix    # Fix

# Frontend linting
cd apps/frontend && yarn lint
```

### Docker
```bash
# Build Docker image
yarn docker:build

# Run development environment
yarn docker:dev

# Run production environment
yarn docker:prod
```

### Cleanup
```bash
# Clean project (Windows)
yarn clean

# Clean project (Linux/macOS)
yarn clean-sh
```

## Architecture Overview

### Monorepo Structure
- `apps/backend/` - Midway.js backend API (port 8080)
- `apps/frontend/` - Vue 3 frontend (port 8000)
- `database/` - Database scripts and schemas
- `docs/` - Comprehensive documentation
- `tools/` - Deployment and maintenance tools
- `testing/` - Test scripts and documentation

### Backend Architecture (Midway.js)

**Core Framework Stack:**
- Midway v3 + Koa
- TypeORM for database ORM
- JWT authentication
- Swagger/OpenAPI documentation
- Dependency injection with decorators

**Key Architectural Patterns:**

1. **Middleware Chain** (order matters):
   - `CorsMiddleware` - CORS handling (first)
   - `ReportMiddleware` - Request logging
   - `AuthMiddleware` - JWT authentication
   - `KitMiddleware` - Multi-tenant context (last)

2. **Multi-Tenant Architecture (Kits)**:
   - "Kit" (套账) provides data isolation between tenants
   - `KitMiddleware` extracts `X-Kit-Id` header or uses user's default kit
   - All business entities are scoped to a kit via `kit_id` foreign key
   - Kit access is validated through `UserKit` join table

3. **Entity Relationships**:
   ```
   Kit (套账) → Customer → Contract → Invoice → Payment
                                    ↓
                           Reconciliation
   ```
   - All business data is isolated by `kit_id`
   - Users can have access to multiple kits via `user_kits` table
   - Each user has a default kit for their session

4. **Service Layer Pattern**:
   - Services handle all business logic
   - Controllers are thin, delegating to services
   - Services use TypeORM repositories for data access
   - Services are injected via `@Inject()` decorator

5. **Authentication Flow**:
   - JWT tokens issued at login contain `userId`
   - `AuthMiddleware` validates JWT and sets `ctx.state.user`
   - `KitMiddleware` validates kit access and sets `ctx.state.kitId`
   - Services receive `kitId` from controllers via `ctx.state.kitId`

**Directory Structure:**
```
apps/backend/src/
├── controller/        # API endpoints (thin layer)
├── service/          # Business logic
├── entity/           # TypeORM entities
├── middleware/       # Request middleware
├── filter/           # Error filters
├── config/           # Environment configs
└── utils/            # Utility functions
```

### Frontend Architecture (Vue 3)

**Core Stack:**
- Vue 3 Composition API
- Vite build tool
- Element Plus UI components
- Pinia state management
- Vue Router 4
- Axios HTTP client

**Key Patterns:**

1. **State Management**:
   - Pinia stores for global state (auth, kit selection)
   - Local component state for UI state

2. **API Integration**:
   - Axios instances in `src/api/`
   - Request interceptors add JWT token and `X-Kit-Id` header
   - Response interceptors handle errors globally

3. **Component Organization**:
   - `views/` - Page components (routed)
   - `components/` - Reusable components
   - `layouts/` - Layout wrappers (MainLayout)

4. **Kit Context**:
   - Kit selector in main layout
   - Selected kit stored in Pinia
   - `X-Kit-Id` header sent with every API request

**Directory Structure:**
```
apps/frontend/src/
├── views/            # Page components
│   ├── customers/
│   ├── contracts/
│   ├── invoices/
│   ├── payments/
│   ├── reconciliations/
│   ├── reports/
│   └── users/
├── components/       # Reusable components
├── layouts/          # Layout wrappers
├── api/             # API clients
├── stores/          # Pinia stores
├── router/          # Route definitions
└── utils/           # Utility functions
```

### Database Design

**Key Concepts:**

1. **Multi-Tenancy via Kits**:
   - `kits` table defines tenants
   - `user_kits` join table for user-kit access
   - All business tables have `kit_id` foreign key

2. **Core Business Tables**:
   - `customers` - Client information
   - `contracts` - Contract records
   - `invoices` - Invoice records
   - `payments` - Payment records
   - `reconciliations` - Financial reconciliation

3. **Attachment System**:
   - `contract_attachments` - Contract files
   - `invoice_attachments` - Invoice files
   - Files stored in local filesystem or MinIO

4. **Status Management**:
   - Contracts: draft → active → completed → cancelled
   - Invoices: draft → sent → received → paid
   - Payments: pending → completed → failed

## Important Development Notes

### Working with Kits (Multi-Tenancy)

When developing features that access business data:

1. **Backend Services**: Always filter by `kit_id`
   ```typescript
   // Example from service layer
   async findByKit(kitId: number) {
     return this.repo.find({ where: { kit_id: kitId } });
   }
   ```

2. **Frontend API Calls**: `X-Kit-Id` header is automatically added by interceptors
   - Ensure kit is selected before making business API calls
   - Kit selector is in the main layout header

3. **Testing**: Use the kit selector to switch between different data contexts

### Middleware Order

The middleware execution order in `configuration.ts` is critical:
```typescript
[CorsMiddleware, ReportMiddleware, AuthMiddleware, KitMiddleware]
```

- CORS must be first for preflight requests
- Auth must come before Kit (Kit needs user context)
- Don't reorder without understanding implications

### Authentication Paths

These paths skip authentication in `AuthMiddleware`:
- `/api/v1/auth/*` - Login, register, refresh
- `/api-docs` - Swagger UI
- `/health/*` - Health checks
- Root path `/`

When adding new public endpoints, update the `skipPaths` array in `auth.middleware.ts`.

### API Versioning

Currently using `/api/v1/` prefix for all endpoints. When making breaking changes:
- Consider creating `/api/v2/` controllers
- Maintain backward compatibility when possible
- Update frontend API clients accordingly

### TypeORM Entities

- All entities extend base patterns with `@Entity()` decorator
- Use `@Column()`, `@PrimaryGeneratedColumn()`, `@ManyToOne()`, etc.
- Timestamps: `@CreateDateColumn()` and `@UpdateDateColumn()`
- Always include `kit_id` foreign key for business entities

### File Uploads

- Backend uses `@midwayjs/upload` component
- Files stored in `uploads/` directory (configurable)
- Attachments linked to contracts/invoices via attachment entities
- Max file size: 10MB (configurable)

### Environment Configuration

Backend uses environment-specific config files:
- `config.local.ts` - Local development
- `config.default.ts` - Default settings
- `config.prod.ts` - Production overrides

Environment variables loaded from `.env` or `.env.local` files.

### Database Migrations

TypeORM migrations are in the backend:
```bash
cd apps/backend
yarn migration:generate -n MigrationName
yarn migration:run
yarn migration:revert
```

### Common Pitfalls

1. **Kit Context Missing**: Ensure `kitId` is passed to all service methods that query business data
2. **Middleware Order**: Changing middleware order can break authentication/authorization
3. **CORS Issues**: CORS middleware must be first in the chain
4. **Circular Dependencies**: Avoid circular imports between services
5. **TypeORM Relations**: Load relations explicitly with `{ relations: [...] }` option

## Testing Strategy

- API tests in `testing/scripts/`
- Backend unit tests using Jest
- Manual testing via Swagger UI at `http://localhost:8080/api-docs`
- Performance tests available via `yarn performance-test`

## Documentation Resources

- **Quick Start**: `docs/QUICK_START.md`
- **Architecture**: `docs/ARCHITECTURE.md`
- **Development Setup**: `docs/DEVELOPMENT_SETUP.md`
- **API Guide**: `docs/development/API_Development_Guide.md`
- **Deployment**: `docs/deployment/README.md`
- **Troubleshooting**: `docs/TROUBLESHOOTING.md`

## Deployment

Multiple deployment options available:
- Docker Compose (recommended)
- GitHub Actions automated deployment
- Manual deployment with Node.js

See `tools/docker/README.md` and `docs/deployment/` for detailed deployment guides.
