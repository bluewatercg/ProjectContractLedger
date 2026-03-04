# 现有代码模式分析

**分析日期:** 2026-02-06

## 前端模式 (Vue 3 + Element Plus)

### 组件库
- **Element Plus 2.4.0** - 完整使用，包括：
  - `el-table`, `el-table-column`
  - `el-form`, `el-form-item`, `el-input`, `el-select`
  - `el-button`, `el-tag`, `el-icon`
  - `ElMessage`, `ElMessageBox` (消息提示)
  - `v-loading` (加载指令)

### 页面结构规范
```vue
<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">页面标题</h2>
      <el-button type="primary">操作按钮</el-button>
    </div>

    <!-- List 页面 -->
    <div class="table-container">
      <div class="table-toolbar">
        <div class="table-search">
          <el-input placeholder="搜索..." />
          <el-select placeholder="筛选..." />
        </div>
      </div>
      <el-table :data="dataList">...</el-table>
    </div>

    <!-- Form 页面 -->
    <div class="form-container">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="字段" prop="field">
          <el-input v-model="form.field" />
        </el-form-item>
        <div class="form-actions">
          <el-button>取消</el-button>
          <el-button type="primary">保存</el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>
```

### Vue 3 Composition API
```typescript
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { moduleApi } from '@/api'
import { useKitStore } from '@/stores/kit'
import type { Entity } from '@/api/types'

const router = useRouter()
const kitStore = useKitStore()

// 状态
const loading = ref(false)
const dataList = ref<Entity[]>([])
const form = ref({})

// 方法
const fetchData = async () => {
  loading.value = true
  try {
    const res = await moduleApi.getList()
    if (res.success) {
      dataList.value = res.data
    }
  } catch (error) {
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>
```

### 表格操作列规范
```vue
<el-table-column label="操作" width="200">
  <template #default="{ row }">
    <el-button size="small" @click="viewItem(row.id)">查看</el-button>
    <el-button size="small" type="primary" @click="editItem(row.id)">编辑</el-button>
    <el-button size="small" type="danger" @click="deleteItem(row.id)">删除</el-button>
  </template>
</el-table-column>
```

### 表单验证规则
```typescript
const rules = {
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}
```

### Kit 多租户集成
- **所有 Form 页面**需要包含 Kit 选择器（如果有多个 Kit）：
```vue
<el-form-item label="所属套账" prop="kitId" v-if="kitStore.kits.length > 1">
  <KitSelect
    v-model="form.kitId"
    :disabled="isEdit"
    placeholder="请选择套账"
  />
</el-form-item>
```

- **所有 List 页面**在 `viewAllKits` 模式下显示套账列：
```vue
<el-table-column v-if="kitStore.viewAllKits" label="所属套账" width="120">
  <template #default="{ row }">
    <el-tag size="small" type="info">{{ getKitName(row.kit_id) }}</el-tag>
  </template>
</el-table-column>
```

### 加载状态
- 使用 `SkeletonLoader` 组件首次加载
- 使用 `v-loading` 指令表单提交/数据刷新

### 路由导航
```typescript
// 编程式导航
router.push('/path/to/page')
router.push({ name: 'RouteName', params: { id } })
router.back()

// 声明式导航
@click="$router.push('/path')"
```

## 后端模式 (Midway.js + TypeORM)

### Controller 规范
```typescript
import { Controller, Get, Post, Put, Del, Body, Param, Query, Inject } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { Validate } from '@midwayjs/validate';
import { ApiTags, ApiOperation, ApiBody, ApiOkResponse } from '@midwayjs/swagger';
import { ModuleService } from '../service/module.service';
import { CreateDto, UpdateDto, ApiResponse } from '../interface';

@ApiTags(['模块名称'])
@Controller('/api/v1/modules')
export class ModuleController {
  @Inject()
  moduleService: ModuleService;

  @Inject()
  ctx: Context;

  @Post('/')
  @ApiOperation({ summary: '创建记录' })
  @ApiBody({ type: CreateDto })
  @ApiCreatedResponse({ description: '创建成功' })
  @Validate()
  async create(@Body() dto: CreateDto): Promise<ApiResponse> {
    try {
      const kitId = this.ctx.state.kitId; // 从中间件获取
      const userId = this.ctx.state.user.id;
      const data = await this.moduleService.create(dto, kitId, userId);
      return {
        success: true,
        data,
        message: '创建成功'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  @Get('/')
  @ApiOperation({ summary: '获取列表' })
  @ApiQuery({ name: 'page', required: false })
  async getList(@Query() query: PaginationQuery): Promise<ApiResponse> {
    const kitId = this.ctx.state.kitId;
    const data = await this.moduleService.getList(query, kitId);
    return { success: true, data };
  }

  @Get('/:id')
  @ApiOperation({ summary: '获取详情' })
  @ApiParam({ name: 'id', description: 'ID' })
  async getById(@Param('id') id: number): Promise<ApiResponse> {
    const kitId = this.ctx.state.kitId;
    const data = await this.moduleService.getById(id, kitId);
    return { success: true, data };
  }

  @Put('/:id')
  @ApiOperation({ summary: '更新记录' })
  @Validate()
  async update(
    @Param('id') id: number,
    @Body() dto: UpdateDto
  ): Promise<ApiResponse> {
    const kitId = this.ctx.state.kitId;
    const data = await this.moduleService.update(id, dto, kitId);
    return { success: true, data, message: '更新成功' };
  }

  @Del('/:id')
  @ApiOperation({ summary: '删除记录' })
  async delete(@Param('id') id: number): Promise<ApiResponse> {
    const kitId = this.ctx.state.kitId;
    await this.moduleService.delete(id, kitId);
    return { success: true, message: '删除成功' };
  }
}
```

### Service 规范
```typescript
import { Provide, Inject } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Entity } from '../entity/entity.entity';
import { CreateDto, UpdateDto, PaginationQuery, PaginationResult } from '../interface';

@Provide()
export class ModuleService {
  @InjectEntityModel(Entity)
  repository: Repository<Entity>;

  /**
   * 创建记录
   */
  async create(dto: CreateDto, kitId: number, createdBy: number): Promise<Entity> {
    const entity = this.repository.create({
      ...dto,
      kit_id: kitId,
      created_by: createdBy,
    });
    return await this.repository.save(entity);
  }

  /**
   * 获取列表（分页）
   */
  async getList(
    query: PaginationQuery & { search?: string },
    kitId?: number
  ): Promise<PaginationResult<Entity>> {
    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'DESC', search } = query;

    const queryBuilder = this.repository.createQueryBuilder('entity');

    // Kit 过滤（多租户隔离）
    if (kitId) {
      queryBuilder.where('entity.kit_id = :kitId', { kitId });
    }

    // 搜索
    if (search) {
      queryBuilder.andWhere('entity.name LIKE :search', { search: `%${search}%` });
    }

    // 排序
    queryBuilder.orderBy(`entity.${sortBy}`, sortOrder as 'ASC' | 'DESC');

    // 分页
    const total = await queryBuilder.getCount();
    const items = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 根据ID获取
   */
  async getById(id: number, kitId?: number): Promise<Entity> {
    const queryBuilder = this.repository.createQueryBuilder('entity');
    queryBuilder.where('entity.id = :id', { id });
    if (kitId) {
      queryBuilder.andWhere('entity.kit_id = :kitId', { kitId });
    }
    const entity = await queryBuilder.getOne();
    if (!entity) {
      throw new Error('记录不存在');
    }
    return entity;
  }

  /**
   * 更新记录
   */
  async update(id: number, dto: UpdateDto, kitId?: number): Promise<Entity> {
    const entity = await this.getById(id, kitId);
    Object.assign(entity, dto);
    return await this.repository.save(entity);
  }

  /**
   * 删除记录
   */
  async delete(id: number, kitId?: number): Promise<void> {
    const entity = await this.getById(id, kitId);
    await this.repository.remove(entity);
  }
}
```

### Entity 规范
```typescript
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Kit } from './kit.entity';
import { User } from './user.entity';

@Entity('table_name')
export class EntityName {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '字段说明' })
  name: string;

  @Column({ name: 'kit_id', comment: '套账ID' })
  kit_id: number;

  @Column({ name: 'created_by', comment: '创建人ID' })
  created_by: number;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updated_at: Date;

  @ManyToOne(() => Kit)
  @JoinColumn({ name: 'kit_id' })
  kit: Kit;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;
}
```

## API 调用规范

### Frontend API Client
```typescript
// apps/frontend/src/api/module.ts
import apiClient from './config'
import type { ApiResponse, PaginationQuery, PaginationResult, Entity, CreateDto, UpdateDto } from './types'

export const moduleApi = {
  /**
   * 获取列表
   */
  getList(params: PaginationQuery & { search?: string }): Promise<ApiResponse<PaginationResult<Entity>>> {
    return apiClient.get('/modules', { params }).then(res => res.data)
  },

  /**
   * 根据ID获取
   */
  getById(id: number): Promise<ApiResponse<Entity>> {
    return apiClient.get(`/modules/${id}`).then(res => res.data)
  },

  /**
   * 创建
   */
  create(data: CreateDto): Promise<ApiResponse<Entity>> {
    return apiClient.post('/modules', data).then(res => res.data)
  },

  /**
   * 更新
   */
  update(id: number, data: UpdateDto): Promise<ApiResponse<Entity>> {
    return apiClient.put(`/modules/${id}`, data).then(res => res.data)
  },

  /**
   * 删除
   */
  delete(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`/modules/${id}`).then(res => res.data)
  }
}
```

### API 响应格式
```typescript
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  code?: number
}

interface PaginationResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
```

## 目录结构规范

### Frontend
```
apps/frontend/src/
├── views/
│   └── {module}/
│       ├── {Module}List.vue      # 列表页
│       ├── {Module}Form.vue      # 表单页（新建/编辑）
│       └── {Module}Detail.vue    # 详情页
├── components/
│   └── {ComponentName}.vue       # 可复用组件
├── api/
│   ├── {module}.ts               # API 调用
│   └── types.ts                  # TypeScript 类型定义
├── stores/
│   └── {store}.ts                # Pinia 状态管理
└── router/
    └── index.ts                  # 路由配置
```

### Backend
```
apps/backend/src/
├── controller/
│   └── {module}.controller.ts    # HTTP 路由处理
├── service/
│   └── {module}.service.ts       # 业务逻辑
├── entity/
│   └── {module}.entity.ts        # TypeORM 实体
├── middleware/
│   └── {name}.middleware.ts      # 中间件
└── interface.ts                  # DTO 和类型定义
```

## 命名规范

### 文件命名
- Vue 组件: PascalCase (CustomerList.vue, CustomerForm.vue)
- API 文件: kebab-case (customer.ts, business-category.ts)
- Service/Controller: kebab-case (customer.service.ts, customer.controller.ts)
- Entity: kebab-case (customer.entity.ts, business-category.entity.ts)

### 变量命名
- 前端: camelCase (customerList, searchQuery, isLoading)
- 后端: camelCase (customerService, createCustomer)
- 数据库列: snake_case (kit_id, created_at, business_category_id)

### 路由命名
- API 端点: /api/v1/{resource} (复数形式)
- 前端路由: /{resource}/{action} (如 /customers/create)

## 关键注意事项

### 多租户（Kit）集成
1. **所有业务实体必须有 `kit_id` 字段**
2. **所有 Service 方法必须接受 `kitId` 参数并过滤**
3. **Controller 从 `ctx.state.kitId` 获取当前 Kit**
4. **前端 Form 需要 KitSelect 组件（多 Kit 时）**
5. **前端 List 在 viewAllKits 模式显示套账列**

### TypeORM 查询
- 使用 `createQueryBuilder` 而非 `find` 方法（更灵活）
- 始终通过 `kit_id` 过滤查询
- 使用参数化查询防止 SQL 注入

### 错误处理
- Controller: try-catch 返回统一格式
- Service: throw Error，由 Controller 捕获
- 前端: ElMessage.error() 显示错误

### 消息提示
- 成功: ElMessage.success('操作成功')
- 错误: ElMessage.error('操作失败')
- 警告: ElMessage.warning('警告信息')
- 确认框: ElMessageBox.confirm('确认删除？')

---
*分析完成: 2026-02-06*
*适用于: 业务分类与统计分析模块开发*
