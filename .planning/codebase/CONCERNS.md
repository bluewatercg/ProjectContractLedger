# Codebase Concerns

**Analysis Date:** 2026-02-06

## Tech Debt

**Hardcoded Default JWT Secret:**
- Issue: Default JWT secret exposed in configuration files and code
- Files: `apps/backend/src/config/config.default.ts` (line 46), `apps/backend/src/middleware/auth.middleware.ts` (line 70)
- Impact: Weak security in development/default setups; tokens could be compromised if default is not changed
- Fix approach: Enforce JWT_SECRET environment variable, fail startup if not provided in production

**Incomplete Refund Logic in Reconciliation:**
- Issue: Refund handling is stubbed with TODO comment but no implementation
- Files: `apps/backend/src/service/reconciliation.service.ts` (lines 377-381)
- Impact: Users can select "refund" action when handling reconciliation differences but nothing happens - confusing UX and incomplete business logic
- Fix approach: Implement actual refund flow that creates negative payment records and updates invoice status

**Missing Persistent Reminder Handling Log:**
- Issue: Reminder processing uses console.log only, no persistent storage
- Files: `apps/backend/src/service/reminder.service.ts` (lines 360-364)
- Impact: No audit trail of which reminders have been acknowledged/handled; users can't track reminder history
- Fix approach: Create `reminder_handled` table to store reminder interactions with timestamps and user IDs

**Excessive console.log Statements in Production Code:**
- Issue: 52 console.log/console.debug/console.warn calls across codebase (middleware, services, controllers)
- Files: `apps/backend/src/middleware/auth.middleware.ts` (8 calls), `apps/backend/src/service/statistics.service.ts` (10 calls), and 8+ other files
- Impact: Performance overhead in production; verbose logging clutters stdout; sensitive info may leak (user IDs, kit IDs in logs)
- Fix approach: Use proper logger abstraction (Midway Logger) with environment-based log levels; remove console.log from production code

**Large Monolithic Files:**
- Issue: Several service files exceed 500 lines (ReconciliationService 492 lines, InvoiceService 463 lines, PaymentService 442 lines)
- Files: `apps/backend/src/service/reconciliation.service.ts`, `apps/backend/src/service/report.service.ts` (849 lines), `apps/backend/src/service/export.service.ts` (569 lines)
- Impact: Difficult to understand, test, and maintain; increased cognitive load; higher risk of bugs in refactoring
- Fix approach: Break services into smaller focused classes (AutoReconciliationService, ManualReconciliationService, etc.)

**Overgrown Interface File:**
- Issue: Single `interface.ts` file contains 947 lines of DTOs and type definitions
- Files: `apps/backend/src/interface.ts`
- Impact: Hard to locate specific interfaces; tight coupling between unrelated domains; performance impact on IDE
- Fix approach: Organize into domain-specific interface files: `auth.interface.ts`, `contract.interface.ts`, `payment.interface.ts`, etc.

## Known Bugs

**Transaction Isolation Missing in Multi-Step Operations:**
- Symptoms: Operations like batch reconciliation don't use transactions for consistency
- Files: `apps/backend/src/service/reconciliation.service.ts` (lines 146-175) - batchAutoReconcile loops without transaction wrapper
- Trigger: If batch reconciliation partially fails (e.g., one invoice fails), some records are saved while others aren't - inconsistent state
- Workaround: Implement transaction wrapper around batch operations

**401 Error Handler Race Condition:**
- Symptoms: Multiple 401 errors may trigger multiple logout flows and redirects
- Files: `apps/frontend/src/api/config.ts` (lines 104-125) - flag-based deduplication with 1000ms timeout
- Trigger: Rapid API calls from different endpoints returning 401 simultaneously
- Workaround: Race condition is partially mitigated by `is401Handling` flag but could still race on flag reset

**Floating Point Precision in Financial Calculations:**
- Symptoms: Amount calculations may have rounding errors
- Files: `apps/backend/src/service/reminder.service.ts` (line 290 uses > 0.01), `apps/backend/src/service/reconciliation.service.ts` (line 62 uses Math.abs without decimal handling)
- Trigger: When dealing with payments split across multiple invoices or exchange rates
- Workaround: Implement Decimal.js library for financial calculations; currently using loose float comparisons

## Security Considerations

**JWT Secret Fallback to Weak Default:**
- Risk: If JWT_SECRET env var is missing, falls back to 'your-secret-key' or 'your-secret-key-change-this-in-production'
- Files: `apps/backend/src/config/config.default.ts` (line 46), `apps/backend/src/middleware/auth.middleware.ts` (line 70), `apps/backend/src/service/auth.service.ts` (line 45)
- Current mitigation: Dev environment only; should fail in production
- Recommendations: (1) Remove fallback, require explicit env var (2) Log warning if default is used (3) Add startup validation

**CORS Configuration Accepts All Origins in Default:**
- Risk: Default CORS config allows `'*'` origin when CORS_ORIGINS not set
- Files: `apps/backend/src/config/config.default.ts` (lines 9-11)
- Current mitigation: Can be overridden via CORS_ORIGINS env var
- Recommendations: (1) Set explicit whitelist of allowed origins (2) Default to empty/none rather than wildcard (3) Document in example .env

**File Upload Path Traversal Risk:**
- Risk: User-supplied filenames used in path construction without sanitization
- Files: `apps/backend/src/controller/attachment.controller.ts` (line 86-89) - `generateFilePath()` uses unsanitized filename
- Current mitigation: File type validation exists but filename not sanitized
- Recommendations: (1) Use UUID for filenames, store original name in DB (2) Validate path doesn't escape upload directory (3) Add filename sanitization

**Missing Rate Limiting on Auth Endpoints:**
- Risk: No rate limiting on login/register endpoints - vulnerable to brute force attacks
- Files: `apps/backend/src/controller/auth.controller.ts`, `apps/backend/src/service/auth.service.ts`
- Current mitigation: None visible in code
- Recommendations: (1) Implement rate limiting middleware (2) Add exponential backoff after failed attempts (3) Lock account after N failed logins

**Unvalidated User Input in Query Parameters:**
- Risk: sortBy, sortOrder parameters used directly in queries without validation
- Files: `apps/backend/src/service/customer.service.ts` (lines 110-118) - dynamic column names not validated against whitelist
- Current mitigation: TypeORM parameterization prevents SQL injection but not semantic validation
- Recommendations: (1) Whitelist allowed sort columns (2) Validate enum values (3) Add input validation decorator

## Performance Bottlenecks

**N+1 Query Problem in Reminder Generation:**
- Problem: Service queries contracts/invoices then loops through each to load related data
- Files: `apps/backend/src/service/reminder.service.ts` (lines 104-182) - loads contract.customer for each contract
- Cause: Relations not eager-loaded in initial query; would fetch customer separately for each contract
- Improvement path: (1) Use leftJoinAndSelect in queryBuilder for customer (2) Cache frequently accessed relationships (3) Consider materialized view for reminders

**Inefficient Statistics Caching Without Invalidation:**
- Problem: Dashboard stats cached for 5 minutes but cache never explicitly invalidated when data changes
- Files: `apps/backend/src/service/statistics.service.ts` (lines 17-45) - cache keyed by kitId/year, TTL 300s
- Cause: No cache invalidation on invoice/payment creation, leading to stale data
- Improvement path: (1) Implement cache invalidation on entity updates (2) Use message queue for async invalidation (3) Add manual cache clear endpoint for admins

**Promise.all Without Timeout or Failfast:**
- Problem: Multiple parallel database queries without timeout protection
- Files: `apps/backend/src/service/reminder.service.ts` (line 55), `apps/backend/src/service/statistics.service.ts` (line 94)
- Cause: If one query hangs, others continue waiting indefinitely
- Improvement path: (1) Add Promise.timeout wrapper (2) Implement Promise.race with timeout (3) Add query timeout config

**Unbounded Query Results:**
- Problem: getAllReminders returns hardcoded top 20 items but doesn't paginate on frontend
- Files: `apps/backend/src/service/reminder.service.ts` (line 86) - returns only first 20 reminders
- Cause: Pagination not implemented, user can't see older reminders
- Improvement path: (1) Add cursor-based pagination (2) Implement scrolling with offset/limit (3) Add filter UI for prioritization

## Fragile Areas

**Attachment File System Storage Without Backup:**
- Files: `apps/backend/src/controller/attachment.controller.ts` (lines 101-147)
- Why fragile: Files stored on local filesystem, not replicated, no backup strategy mentioned
- Safe modification: (1) Add integration tests that verify file persistence (2) Document backup procedure (3) Consider MinIO/cloud storage
- Test coverage: Limited; no tests for file upload failure scenarios

**Multi-Tenant Data Isolation via Kit ID:**
- Files: `apps/backend/src/middleware/kit.middleware.ts`, all service files with `kit_id` filtering
- Why fragile: Entire security model depends on kitId correctly passed in header; one missed query breaks isolation
- Safe modification: (1) Add audit tests that verify all queries filter by kit_id (2) Use middleware to enforce kit context (3) Create wrapper service that ensures kit filtering
- Test coverage: Kit middleware exists but no comprehensive tests for data leakage

**Session Management Without Session Store:**
- Files: `apps/backend/src/middleware/auth.middleware.ts` (line 70 - JWT only, no session)
- Why fragile: JWT token has 24h expiry but no logout mechanism (tokens can't be revoked)
- Safe modification: (1) Add token blacklist on logout (2) Implement Redis-backed session store (3) Use shorter token expiry with refresh tokens
- Test coverage: No logout or token revocation tests found

**Batch Operations Without Validation:**
- Files: `apps/backend/src/service/reconciliation.service.ts` (lines 146-175)
- Why fragile: batchAutoReconcile doesn't validate input array size or structure
- Safe modification: (1) Add max batch size validation (2) Validate each invoiceId before processing (3) Return detailed error per item
- Test coverage: No batch operation tests found

## Scaling Limits

**In-Memory Cache Without Distributed Support:**
- Current capacity: Single instance only (SimpleCache in memory)
- Limit: Cache not shared between application instances; won't work in clustered deployment
- Scaling path: (1) Replace SimpleCache with Redis-backed cache (2) Implement cache invalidation across instances (3) Use message queue for cache busting

**Database Connection Pool Size Fixed at 10:**
- Current capacity: 10 connections (configurable via DB_POOL_SIZE env var)
- Limit: Fixed pool; no auto-scaling or overflow handling
- Scaling path: (1) Increase pool size for high concurrency (2) Implement connection queuing (3) Use read replicas for reports/analytics

**No Pagination Limits on List Endpoints:**
- Current capacity: Default 20 items, hardcoded
- Limit: Large datasets not handled; memory spikes on full table scans
- Scaling path: (1) Implement cursor-based pagination (2) Add max limit validation (3) Create indices on sort columns

## Dependencies at Risk

**TypeScript 4.8.0 (Old Version):**
- Risk: TypeScript 4.8 released in 2022; current is 5.x with bug fixes and performance improvements
- Impact: Missing type inference improvements; potential type safety issues with newer patterns
- Migration plan: (1) Update to TypeScript 5.1+ (2) Run type checker and fix issues (3) Update related type definitions (@types/node)

**Node.js Minimum Version 12 (EOL):**
- Risk: Node 12 reached EOL in April 2022; security vulnerabilities won't be patched
- Impact: Potential exploits; incompatibility with newer dependencies
- Migration plan: (1) Update engines.node to >=18.0.0 (2) Test with Node 20 LTS (3) Update CI/CD pipelines

**SQLite3 in Production Package.json:**
- Risk: Both mysql2 and sqlite3 dependencies listed; ambiguous which is used
- Impact: Unexpected database switch if code changes; deployment confusion
- Migration plan: (1) Remove unused database driver (2) Document database choice (3) Add database driver validation in startup

## Missing Critical Features

**No Audit Logging:**
- Problem: No comprehensive audit trail of who changed what and when
- Blocks: Compliance audits; user debugging; fraud detection
- Missing tables/functionality: audit_log table, audit middleware, audit service

**No Data Export/Import Features:**
- Problem: Users can't bulk import customers/contracts; can't export full dataset for analysis
- Blocks: Data migration; integration with external systems; business intelligence
- Missing tables/functionality: Import jobs table, import validation service, export scheduler

**No Bulk Delete with Verification:**
- Problem: No soft delete support; bulk operations missing
- Blocks: Safe data cleanup; accidental deletion prevention; recovery capability
- Missing tables/functionality: deleted_at column on entities, soft delete service, restore endpoints

## Test Coverage Gaps

**No Authentication/Authorization Tests:**
- What's not tested: JWT validation, kit access control, role-based permissions, token expiry
- Files: All auth/kit middleware, all protected endpoints
- Risk: Unauthorized access could silently work if middleware changes
- Priority: High

**No File Upload/Download Tests:**
- What's not tested: File type validation, size limits, path traversal prevention, cleanup on failure
- Files: `apps/backend/src/controller/attachment.controller.ts`
- Risk: File system corruption, disk space exhaustion, security vulnerabilities
- Priority: High

**No Transaction/Rollback Tests:**
- What's not tested: Atomic operations, partial failure handling in batch operations
- Files: All services with transaction() calls
- Risk: Inconsistent data state if operations partially fail
- Priority: Medium

**No Multi-Tenant Isolation Tests:**
- What's not tested: Kit context isolation, data leakage between kits, kit access control
- Files: All entity queries with kit_id filtering
- Risk: Users seeing other users' data
- Priority: High

**No Error Handling Tests:**
- What's not tested: Network errors, database errors, validation errors
- Files: All controllers with catch blocks
- Risk: Unhandled exceptions causing 500 errors, poor user feedback
- Priority: Medium

**No API Contract/Integration Tests:**
- What's not tested: API response formats, pagination, sorting, filtering
- Files: All controller endpoints
- Risk: Breaking changes in API; client incompatibility
- Priority: Medium

**No Frontend Unit Tests:**
- What's not tested: Component rendering, event handling, data binding
- Files: `apps/frontend/src/components/`, `apps/frontend/src/views/`
- Risk: UI bugs; regression in refactoring
- Priority: Medium

---

*Concerns audit: 2026-02-06*
