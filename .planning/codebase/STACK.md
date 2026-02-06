# Technology Stack

**Analysis Date:** 2026-02-06

## Languages

**Primary:**
- TypeScript 4.8.0 (backend) - API and business logic
- TypeScript 5.2.0 (frontend) - UI components and state management
- HTML/CSS - Frontend markup and styling

**Secondary:**
- JavaScript - Configuration files, scripts, and utilities
- SQL - Database queries and schema

## Runtime

**Environment:**
- Node.js >= 12.0.0 - Backend and build tooling
- Browser environment (ES2020+) - Frontend execution

**Package Manager:**
- Yarn (monorepo) - Primary package manager for root, backend, and frontend
- npm - Secondary package manager (package-lock.json present)
- Lockfiles: `yarn.lock` (root), `package-lock.json` (frontend)

## Frameworks

**Backend Core:**
- Midway v3.12.0 - Backend framework with Koa integration
- Koa - HTTP server and middleware foundation
- TypeORM 0.3.17 - Object-relational mapping for MySQL database
- Express-style middleware pattern via `@midwayjs/koa`

**Frontend Core:**
- Vue 3.3.0 - UI framework using Composition API
- Vue Router 4.2.0 - Client-side routing
- Vite 4.5.0 - Build tool and dev server
- Element Plus 2.4.0 - UI component library

**Testing:**
- Jest 29.2.2 (backend) - Unit testing framework
- ts-jest 29.0.3 - TypeScript support for Jest
- @midwayjs/mock 3.12.0 - Midway testing utilities

**Build/Dev:**
- mwts 1.3.0 (backend) - Midway TypeScript utilities
- mwtsc 1.4.0 (backend) - Midway TypeScript compiler
- Prettier 3.6.2 - Code formatter
- ESLint 9.34.0 (frontend) - Frontend linting
- TypeScript compiler 4.8.0 (backend), 5.2.0 (frontend)

## Key Dependencies

**Critical:**
- bcryptjs 2.4.3 - Password hashing for authentication
- jsonwebtoken 9.0.0 - JWT token generation and validation
- exceljs 4.4.0 - Excel file generation for exports
- pdfkit 0.17.2 - PDF document generation for reports
- dayjs 1.11.0 - Date/time manipulation library
- echarts 5.4.0 - Data visualization for charts

**Infrastructure:**
- mysql2 3.2.4 - MySQL database driver and connection pooling
- typeorm 0.3.17 - ORM for database operations
- cors 2.8.5 - CORS middleware for cross-origin requests
- dotenv 16.0.3 - Environment variable loading

**Frontend UI:**
- @element-plus/icons-vue 2.1.0 - Icon components
- axios 1.6.0 - HTTP client for API calls
- pinia 2.1.0 - State management store
- vue-router 4.2.0 - Client-side routing

**Development Tools:**
- @vitejs/plugin-vue 4.4.0 - Vite Vue 3 support
- unplugin-auto-import 0.16.0 - Auto-import for Vue/Pinia/Router
- unplugin-vue-components 0.25.0 - Auto-import Vue components
- @typescript-eslint/eslint-plugin 8.41.0 - TypeScript linting
- eslint-plugin-vue 10.4.0 - Vue file linting

## Configuration

**Environment:**
- Environment-specific config files in `apps/backend/src/config/`
  - `config.default.ts` - Base configuration with sensible defaults
  - `config.local.ts` - Local development overrides (hardcoded values)
  - `config.prod.ts` - Production environment variables
  - `config.unittest.ts` - Test environment configuration

**Environment Variables (Backend):**
- `NODE_ENV` - Environment mode (local, production, unittest)
- `BACKEND_PORT` - Server port (default 8080)
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` - MySQL connection
- `DB_POOL_SIZE` - Connection pool size (default 10 dev, 20 prod)
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB` - Redis cache connection
- `JWT_SECRET` - JWT signing key (required in production)
- `JWT_EXPIRES_IN` - Token expiration (default 24h)
- `UPLOAD_DIR` - File upload directory (default /app/uploads)
- `LOG_LEVEL`, `CONSOLE_LOG_LEVEL` - Logging configuration
- `CORS_ORIGINS` - CORS whitelist
- `TZ` - Timezone (Asia/Shanghai)

**Build:**
- `tsconfig.json` (backend) - TypeScript compilation for Node.js (ES2018 target)
- `tsconfig.json` (frontend) - TypeScript compilation for browser (ES2020 target)
- `jest.config.js` (backend) - Jest test configuration with ts-jest preset
- `.prettierrc.js` (backend) - Extends mwts prettier configuration
- `.eslintrc.json` (backend) - Extends mwts eslint configuration
- `.eslintrc.json` (frontend) - Custom ESLint rules for Vue/TypeScript
- `vite.config.ts` (frontend) - Vite build configuration with Vue plugin

**Frontend Config:**
- Path aliases: `@/*` → `src/*` in `tsconfig.json`
- Vite proxy: `/api` requests proxied to backend during dev
- Auto-import plugins: Vue, Vue Router, Pinia composables
- Auto-import plugins: Element Plus components on-demand

## Platform Requirements

**Development:**
- Node.js >= 12.0.0
- Yarn package manager
- Windows/Linux/macOS compatible (bash/PowerShell scripts provided)

**Production:**
- Node.js 12+
- MySQL 5.7 or 8.0+ (configured for timezone +08:00)
- Redis 4.0+ (optional, configured but not required)
- Docker 20.10+ (for containerized deployment)
- 1GB RAM minimum (Docker resource limits set to 1GB for backend)
- 512MB RAM for frontend container

**Database:**
- MySQL 8.0 as primary database
- TypeORM auto-entities discovery from `**/entity/*.entity{.ts,.js}`
- No auto-synchronization (synchronize: false) - migrations managed manually

**Middleware Stack Order (Critical):**
1. `CorsMiddleware` - Must be first for preflight requests
2. `ReportMiddleware` - Request logging
3. `AuthMiddleware` - JWT authentication
4. `KitMiddleware` - Multi-tenant context extraction

---

*Stack analysis: 2026-02-06*
