# AGENTS.md

This guide helps agentic coding agents work effectively in the ProjectContractLedger codebase.

## Build, Lint, and Test Commands

### Root Level Commands

```bash
# Install all dependencies (both backend and frontend)
yarn install-all

# Build all applications
yarn build-all

# Start development (uses platform-specific scripts)
yarn dev              # Windows
yarn dev-ps           # PowerShell
yarn dev-sh           # Linux/Mac
```

### Backend (apps/backend)

```bash
cd apps/backend

# Development
yarn dev                          # Start with watch mode
yarn dev:skip-migration           # Start without DB migrations

# Build
yarn build                         # Compile TypeScript with mwtsc

# Testing
yarn test                          # Run all tests
yarn test <path/to/test.test.ts>   # Run single test file
yarn cov                            # Run tests with coverage

# Linting
yarn lint                          # Check with mwts
yarn lint:fix                      # Auto-fix with mwts

# Production
yarn start                         # Start production server (NODE_ENV=production)
```

### Frontend (apps/frontend)

```bash
cd apps/frontend

# Development
yarn dev          # Start Vite dev server

# Build
yarn build        # Build for production
yarn preview      # Preview production build

# Linting
yarn lint         # Run ESLint with auto-fix
```

## Code Style Guidelines

### Backend (Midway.js + TypeScript)

**Imports & Exports**

- Order: external libs -> @midwayjs imports -> local imports
- Use named exports for services/controllers
- Use `@Provide()` decorator on service classes
- Use `@Inject()` for dependency injection

```typescript
import { Provide, Inject } from "@midwayjs/core";
import { InjectEntityModel } from "@midwayjs/typeorm";
import { Repository } from "typeorm";
import { Contract } from "../entity/contract.entity";

@Provide()
export class ContractService {
  @InjectEntityModel(Contract)
  contractRepository: Repository<Contract>;
}
```

**Controller Pattern**

- Use decorators: `@Controller('/api/v1/resource')`
- Route methods: `@Get()`, `@Post()`, `@Put()`, `@Del()`
- Parameter decorators: `@Body()`, `@Param()`, `@Query()`
- Validate with `@Validate()` decorator from @midwayjs/validate

```typescript
@Controller("/api/v1/contracts")
export class ContractController {
  @Inject()
  contractService: ContractService;

  @Post("/")
  @Validate()
  async createContract(@Body() dto: CreateContractDto): Promise<ApiResponse> {
    try {
      const result = await this.contractService.createContract(dto);
      return { success: true, data: result, message: "Success" };
    } catch (error) {
      return { success: false, message: error.message, code: 400 };
    }
  }
}
```

**Service Layer**

- Business logic in services, controllers handle HTTP
- Use repository pattern for database operations
- Return formatted responses with `DateUtil.formatEntityResponse()` for date fields

**Entity Definition**

- Use TypeORM decorators: `@Entity()`, `@PrimaryGeneratedColumn()`, `@Column()`
- Database columns: snake_case (e.g., `created_at`, `kit_id`)
- Entity properties: camelCase
- Relations: `@ManyToOne()`, `@OneToMany()`, `@JoinColumn()`

```typescript
@Entity("contracts")
export class Contract {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  kit_id: number;

  @Column({ type: "enum", enum: ["draft", "active", "completed", "cancelled"] })
  status: string;

  @CreateDateColumn()
  created_at: Date;
}
```

**Error Handling**

- Wrap controller logic in try-catch blocks
- Return `ApiResponse<T>` with proper error messages and codes
- Common codes: 200 (success), 400 (bad request), 404 (not found), 500 (server error)

**TypeScript Configuration**

- Target: ES2018
- Decorators enabled (`experimentalDecorators`, `emitDecoratorMetadata`)
- Strict mode with `noImplicitThis`, `noUnusedLocals`, `strictNullChecks`

### Frontend (Vue 3 + TypeScript)

**Imports & Exports**

- Auto-import enabled: Vue APIs and components are auto-imported
- Use `@/*` path alias for `src/*`
- API imports: `import { apiName } from '@/api/module'`

```typescript
import { ref, computed } from "vue"; // Auto-imported
import { contractApi } from "@/api/contract";
```

**Component Style**

- Use Composition API with `<script setup lang="ts">`
- Define reactive state with `ref()` and `computed()`
- Emit events: `const emit = defineEmits<Emits>()`

```vue
<script setup lang="ts">
import { ref, computed } from "vue";

const loading = ref(false);
const items = ref([]);

const totalCount = computed(() => items.value.length);
</script>
```

**API Layer**

- Separate API files in `src/api/` (e.g., `contract.ts`, `customer.ts`)
- Export named objects with async methods
- Use typed responses: `Promise<ApiResponse<T>>`
- Return `res.data` from API calls

```typescript
export const contractApi = {
  getContracts(
    params: PaginationQuery,
  ): Promise<ApiResponse<PaginationResult<Contract>>> {
    return apiClient.get("/contracts", { params }).then((res) => res.data);
  },
};
```

**State Management (Pinia)**

- Use Composition API stores in `src/stores/`
- Define stores with `defineStore('name', () => { ... })`
- Return state, computed properties, and actions

```typescript
export const useAuthStore = defineStore("auth", () => {
  const token = ref<string>("");
  const isAuthenticated = computed(() => !!token.value);
  const login = async (data: LoginDto) => {
    /* ... */
  };
  return { token, isAuthenticated, login };
});
```

**TypeScript Configuration**

- Strict mode enabled
- No unused parameters/locals allowed
- Path alias: `@/*` maps to `src/*`
- JSX preserve for Vue SFCs

## Common Patterns

**API Response Format**

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code?: number;
}
```

**Pagination**

```typescript
interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

interface PaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

**DTO Pattern**

- Use class-based DTOs with `@ApiProperty()` decorator
- Create DTOs for both create and update operations
- Mark optional fields in Update DTOs with `@ApiPropertyOptional()`

**Date Handling**

- Backend: Use `DateUtil.parseDate()` for input, `DateUtil.formatEntityResponse()` for output
- Frontend: Use dayjs library for date manipulation

## Testing

**Test Structure**

- Backend tests in `apps/backend/test/`
- Use `@midwayjs/mock` for app creation
- Test with Jest assertions

```typescript
import { createApp, close, createHttpRequest } from "@midwayjs/mock";
import { Framework } from "@midwayjs/koa";

describe("Example Test", () => {
  it("should GET /", async () => {
    const app = await createApp<Framework>();
    const result = await createHttpRequest(app).get("/");
    expect(result.status).toBe(200);
    await close(app);
  });
});
```

**Run Single Test**

```bash
# From backend directory
yarn test path/to/test.test.ts

# With watch mode
yarn test -- path/to/test.test.ts --watch
```

## Important Notes

- No comments in code unless absolutely necessary
- Use mwts for backend linting (extends Midway TypeScript style guide)
- ESLint for frontend (extends eslint:recommended)
- Prettier configured via mwts (backend) and project defaults (frontend)
- Use Chinese for user-facing text, English for code
- Kit (套账) isolation: All operations must respect `kit_id` from context
- Caching: Invalidate relevant caches when data changes (e.g., statisticsService.invalidateContractCache())
