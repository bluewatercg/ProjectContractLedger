# External Integrations

**Analysis Date:** 2026-02-06

## APIs & External Services

**File Storage:**
- Local filesystem via `@midwayjs/upload` component
  - Upload endpoint: `/api/v1/attachments/upload`
  - Files stored in `UPLOAD_DIR` (default `/app/uploads`)
  - Max file size: 10MB (configurable)
  - Whitelist: `.pdf`, `.jpg`, `.jpeg`, `.png`
  - Client SDK: Native Node.js fs and Multer via Midway

**Avatar Service (External):**
- DiceBear Avatars API (dicebear.com)
  - Endpoint: `https://api.dicebear.com/7.x/avataaars/svg`
  - Usage: Generate user avatar images dynamically in frontend
  - Implementation: `apps/frontend/src/layouts/MainLayout.vue` (line with `dicebear` reference)
  - Auth: None required (public API)

## Data Storage

**Databases:**
- MySQL 8.0 (Primary)
  - Configured via `apps/backend/src/config/`
  - Connection: TypeORM with mysql2 driver
  - Connection pooling: 10-20 connections (configurable via `DB_POOL_SIZE`)
  - Host: Environment variable `DB_HOST`
  - Port: Environment variable `DB_PORT` (default 3306)
  - Auth: Username/Password via `DB_USERNAME`, `DB_PASSWORD`
  - Database: `procontractledger` (via `DB_DATABASE`)
  - Timezone: +08:00 (Asia/Shanghai)
  - Schema: Auto-discovered from `**/entity/*.entity{.ts,.js}`
  - No auto-sync (migrations managed separately)

**File Storage:**
- Local filesystem (primary)
  - Directory: `/app/uploads` or `UPLOAD_DIR` env var
  - Mapped in Docker: `./data/uploads:/app/uploads`
  - Attachment types: Contract attachments, Invoice attachments
  - Entities: `contract-attachment.entity.ts`, `invoice-attachment.entity.ts`

**Caching:**
- Redis (optional, production-configured)
  - Host: Environment variable `REDIS_HOST`
  - Port: Environment variable `REDIS_PORT` (default 6379)
  - Password: Environment variable `REDIS_PASSWORD` (may be empty)
  - Database: Environment variable `REDIS_DB` (default 0, production uses 13)
  - Configuration: `apps/backend/src/config/config.*.ts`
  - Status: Configured in `config.default.ts` and `config.prod.ts` but not actively used in code

## Authentication & Identity

**Auth Provider:**
- Custom implementation (no third-party auth service)
  - Implementation: `apps/backend/src/service/auth.service.ts`
  - Tokens: JWT (JSON Web Tokens)
  - Secret: `JWT_SECRET` environment variable (required in production)
  - Expiration: `JWT_EXPIRES_IN` (default 24h, production 7d)
  - Token format: Bearer token in `Authorization: Bearer {token}` header
  - Password hashing: bcryptjs 2.4.3
  - Token validation: Middleware in `apps/backend/src/middleware/auth.middleware.ts`

**Authorization:**
- Multi-tenant via Kits (套账 system)
  - Kit selection: Header `X-Kit-Id`
  - Implementation: `apps/backend/src/middleware/kit.middleware.ts`
  - User-Kit mapping: `user_kits` table for access control
  - Scope: All business entities filtered by `kit_id` foreign key

**Public Endpoints (skip auth):**
- `/api/v1/auth/login` - Login endpoint
- `/api/v1/auth/register` - Registration endpoint
- `/api/v1/auth/refresh` - Token refresh endpoint
- `/api-docs` - Swagger API documentation
- `/health/*` - Health check endpoints
- `/` - Root path

## Monitoring & Observability

**Error Tracking:**
- Not detected - No external error tracking service (Sentry, DataDog, etc.)
- Local error handling via middleware and service error filters
- Error filter: `apps/backend/src/filter/` (structure exists)

**Logs:**
- Local file logging via Midway logger
  - Configuration: `apps/backend/src/config/config.default.ts` midwayLogger section
  - Default output: `/app/logs/` directory
  - File logs: `app.log`, `error.log`, `core.log`, `core-error.log`, `app-error.log`
  - Log rotation: 30 days max files, 100MB max size
  - Log levels: Configurable via `LOG_LEVEL` (default info)
  - Console logging: Separate level via `CONSOLE_LOG_LEVEL`
  - Audit logging: `audit.json` support configured

**Request Logging:**
- Middleware-based request logging
  - Implementation: `apps/backend/src/middleware/report.middleware.ts`
  - Captures request method, URL, headers

## CI/CD & Deployment

**Hosting:**
- Docker containers (primary deployment method)
  - Docker Compose orchestration: `deployment/docker-compose.yml`, `tools/docker/docker-compose.yml`
  - Backend image: `ghcr.io/bluewatercg/projectcontractledger-backend:latest`
  - Frontend image: `ghcr.io/bluewatercg/projectcontractledger-frontend:latest`
  - Container registry: GitHub Container Registry (ghcr.io)
  - Backend port mapping: `8080:8080` (container:host)
  - Frontend port mapping: `80` or `8000` (container:host)

**Database Services:**
- MySQL: `mysql:8.0` (Docker image)
  - Port: `3306:3306`
  - Volume: `mysql_data` (named volume)
  - Network: `contract-network`

**Additional Services (Docker):**
- Redis 7-alpine (optional, in production compose)
- Nginx alpine (optional, reverse proxy profile)

**CI Pipeline:**
- Not detected in core codebase
- GitHub Actions likely (ghcr.io registry used)
- No `.github/workflows` analyzed

**Build System:**
- Frontend: `vite build` → generates `dist/` folder
- Backend: `mwtsc --cleanOutDir` → generates compiled JavaScript in `dist/`

## Environment Configuration

**Required env vars (Production):**
- `DB_HOST` - MySQL server address
- `DB_PORT` - MySQL server port
- `DB_USERNAME` - MySQL user
- `DB_PASSWORD` - MySQL password
- `DB_DATABASE` - Database name
- `JWT_SECRET` - JWT signing secret
- `BACKEND_PORT` - Server listening port
- `NODE_ENV` - Set to 'production'

**Optional env vars (Production):**
- `REDIS_HOST` - Redis server (if using caching)
- `REDIS_PORT` - Redis port
- `REDIS_PASSWORD` - Redis password
- `REDIS_DB` - Redis database number
- `LOG_LEVEL` - Log verbosity
- `CORS_ORIGINS` - Comma-separated CORS whitelist
- `UPLOAD_DIR` - File upload directory
- `TZ` - Server timezone
- `ENABLE_COMPRESSION` - gzip compression (default true)
- `ENABLE_CACHE` - Caching (default true)
- `CACHE_TTL` - Cache expiration in seconds
- `ENABLE_RATE_LIMIT` - Rate limiting (default true)
- `MAX_REQUESTS_PER_MINUTE` - Rate limit threshold
- `DB_POOL_SIZE` - Connection pool size

**Secrets location:**
- Development: `apps/backend/src/config/config.local.ts` (hardcoded, not for production)
- Production: Environment variables via `.env` file or deployment platform
- Template files: `deployment/.env.*template` files for setup guidance
- Current config: `deployment/.env` contains production values

## Webhooks & Callbacks

**Incoming:**
- Not detected - No webhook receivers configured

**Outgoing:**
- Not detected - No outbound webhook integrations

## API Documentation

**Swagger/OpenAPI:**
- Endpoint: `/api-docs` (when authentication skipped)
- Generated from code decorators
- Configuration: `apps/backend/src/config/config.default.ts` swagger section
- Title: 客户合同管理系统API (Contract Management System API)
- Version: 1.0.0
- Tags: 用户认证, 客户管理, 合同管理, 发票管理, 支付管理, 附件管理
- UI: Swagger UI (via @midwayjs/swagger)

## Export/Report Services

**PDF Generation:**
- pdfkit 0.17.2 library
  - Implementation: `apps/backend/src/service/export.service.ts`
  - Methods: exportToPdf(), addContractDataToPdf(), addInvoiceDataToPdf(), etc.

**Excel Generation:**
- exceljs 4.4.0 library
  - Implementation: `apps/backend/src/service/export.service.ts`
  - Methods: exportToExcel() with worksheet formatting

**CSV Generation:**
- Native JavaScript string building
  - Implementation: `apps/backend/src/service/export.service.ts`
  - Methods: exportToCsv(), includes BOM for UTF-8 Chinese support

## Frontend API Client

**HTTP Client:**
- Axios 1.6.0
  - Configuration: `apps/frontend/src/api/config.ts`
  - Base URL: Dynamic (built from environment variables or runtime config)
  - Timeout: 10000ms
  - Default headers: `Content-Type: application/json`

**Request Interceptors:**
- JWT token injection: `Authorization: Bearer {token}`
- Kit context: `X-Kit-Id` header with current kit ID
- API versioning: `X-API-Version` header
- Client version: `X-Client-Version` header
- Request logging to console (dev)

**Response Interceptors:**
- Global error handling with ElMessage notifications
- HTTP status handling: 401 (logout redirect), 403 (permission denied), 404 (not found), 500 (server error)
- Unified response format validation (checks `data.success`)
- Network error handling with user feedback
- 401 handling with redirect to `/login` page

---

*Integration audit: 2026-02-06*
