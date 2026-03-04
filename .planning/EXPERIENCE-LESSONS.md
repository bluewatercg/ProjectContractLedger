# Experience & Lessons — ProjectContractLedger

> 记录项目实施过程中的技术决策、实现细节和经验教训。
> 供后续开发阶段参考，避免重复踩坑。

---

## 已实现功能清单

### Phase 1: 业务类型基础设施（2026-02-06，已完成 ✓）

**目标：** 用户可以独立管理业务类型的多层级树形结构

#### 后端（01-01）

| 组件 | 文件 | 说明 |
|------|------|------|
| Entity | `apps/backend/src/entity/business-category.entity.ts` | 自引用树形结构，86行 |
| Service | `apps/backend/src/service/business-category.service.ts` | 6个树操作方法，390行 |
| Controller | `apps/backend/src/controller/business-category.controller.ts` | REST API，442行 |

**API 端点：**

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/v1/business-categories` | 获取完整树形结构（可按状态过滤） |
| POST | `/api/v1/business-categories` | 创建新分类 |
| PUT | `/api/v1/business-categories/:id` | 更新分类名称/状态 |
| DELETE | `/api/v1/business-categories/:id` | 删除（含子节点和合同数量验证） |
| POST | `/api/v1/business-categories/move` | 拖拽移动节点 |
| PATCH | `/api/v1/business-categories/:id/toggle-status` | 切换启用/禁用 |

#### 前端（01-02）

| 组件 | 文件 | 说明 |
|------|------|------|
| API Client | `apps/frontend/src/api/business-category.ts` | 6个方法，55行 |
| 页面 | `apps/frontend/src/views/business-categories/BusinessCategoryTree.vue` | 树管理页面，366行 |
| 路由 | `apps/frontend/src/router/index.ts` | `/business-categories` 路由 |
| 菜单 | `apps/frontend/src/layouts/MainLayout.vue` | 侧边栏"业务类型"菜单项 |

#### 数据库（01-03）

| 文件 | 说明 |
|------|------|
| `database/migrations/create_business_categories_table.sql` | 建表脚本，含外键约束和索引 |

**数据库表结构关键字段：**
- `parent_id` — 自引用，实现树形层级（NULL 表示根节点）
- `sort_order` — 同级排序
- `kit_id` — 多租户隔离
- `status` ENUM(`active`, `disabled`) — 启用/禁用状态

---

## 技术决策记录

### 决策 1：Adjacency List 树形存储模式

- **选择：** 使用 `parent_id` 自引用的邻接表（Adjacency List）
- **放弃的方案：** Materialized Path、Closure Table、Nested Sets
- **理由：** 写操作和节点移动更简单；对于预期的树规模（几十个节点），读性能可接受
- **实现：** Service 一次性加载所有节点，内存中构建树（Two-pass 算法）
- **适用：** 小到中等规模的树形数据（< 1000 节点）

### 决策 2：内存中构建树（避免 N+1 查询）

- **选择：** 单次 `findMany` 加载所有节点，在应用层递归构建嵌套结构
- **放弃的方案：** 递归 SQL 查询、Eager Loading 关联、多次查询
- **理由：** 避免 N+1 查询问题；业务分类数量有限，全量加载可接受
- **Two-pass 算法：**
  1. 第一遍：将所有节点放入 `Map<id, node>`，初始化空 `children` 数组
  2. 第二遍：遍历所有节点，将每个节点追加到父节点的 `children`；收集根节点

### 决策 3：sort_order 位移方案

- **选择：** 拖拽插入时，对目标位置后的兄弟节点执行 `sort_order` 递增位移
- **放弃的方案：** 浮点数间距（1.0, 1.5, 1.25...）、重新顺序编号
- **理由：** 整数运算简单可靠；节点数量少，批量更新成本低

### 决策 4：禁用节点的拖拽限制

- **选择：** `allowDrag` 和 `allowDrop` 函数均排除 `disabled` 状态节点
- **理由：** 防止误操作重新组织已停用的分类；UI 语义更清晰
- **实现：** el-tree 的 `:allow-drag` 和 `:allow-drop` prop 传入校验函数

### 决策 5：TypeORM 实体自动发现

- **确认：** TypeORM 已通过 glob 模式 `**/entity/*.entity{.ts,.js}` 自动发现实体
- **无需：** 在 `configuration.ts` 中手动注册新实体
- **前提：** 实体文件必须符合命名规范 `*.entity.ts` 且在 `entity/` 目录下

---

## 经验教训

### 经验 01：删除操作需要两层验证

- **来源：** Phase 1 业务类型删除功能
- **规则：** 删除树形节点前必须验证：① 是否有子节点、② 是否有关联业务数据
- **实现方式：** Service 返回 `{ success, contractCount, childCount }` 给前端显示确认弹窗
- **注意：** Phase 1 中 `getContractCount` 暂时返回 0（TODO 注释），Phase 2 集成合同后需实现真实查询
- **适用范围：** 所有有关联数据的树形/分类节点删除

### 经验 02：循环引用防护不可省略

- **来源：** Phase 1 拖拽移动节点功能
- **规则：** 移动树形节点时必须检查目标节点是否为源节点的后代，否则会产生循环引用导致无限递归
- **实现：** `isDescendantOf(potentialAncestorId, nodeId)` 方法，在 moveNode 前调用
- **适用范围：** 所有支持拖拽移动的树形结构

### 经验 03：多租户隔离的统一模式

- **来源：** 本项目所有业务 Service
- **规则：** 所有查询必须通过 `kit_id` 过滤；Controller 从 `ctx.state.kitId` 获取 Kit 上下文
- **禁止：** 在 Service 层直接查询用户 ID 来确定 Kit，应由中间件注入
- **中间件链：** CorsMiddleware → ReportMiddleware → AuthMiddleware → KitMiddleware（顺序不可变）
- **适用范围：** 所有新增的业务数据 Entity 和 Service

### 经验 04：计划与实际执行的重叠处理

- **来源：** Phase 1，Plan 01-02 执行时发现 BusinessCategoryTree.vue 已在 01-01 中提交
- **规则：** 执行前检查文件是否已存在；若内容满足需求则跳过，记录为偏差但不影响计划
- **影响：** 零影响，各阶段验证仍通过
- **适用范围：** 并行计划或跨计划有依赖关系的文件

### 经验 05：手动数据库迁移的验证步骤

- **来源：** Phase 1，Plan 01-03 数据库迁移
- **规则：** 执行迁移 SQL 后必须用 `SHOW TABLES` 和 `DESCRIBE table_name` 验证表结构
- **当前方式：** 手动通过 mysql CLI 执行（非 TypeORM migration:run）
- **原因：** 团队习惯手动管控 schema 变更，保持对数据库状态的直接控制
- **适用范围：** 每次新增数据库表或修改已有表结构

---

## 已知待处理项（Technical Debt）

| 文件 | 行号 | 问题 | 计划解决 |
|------|------|------|---------|
| `apps/backend/src/service/business-category.service.ts` | 381-387 | `getContractCount` 返回 0（TODO 占位） | Phase 2 集成合同后实现 |
| `apps/frontend/src/config.ts` | — | 已存在 TypeScript 错误（与本期无关） | 独立修复 |
| `apps/frontend/src/utils/version.ts` | — | 已存在 TypeScript 错误（与本期无关） | 独立修复 |
| `apps/frontend/src/utils/chartTheme.ts` | — | 已存在 TypeScript 错误（与本期无关） | 独立修复 |

---

## Phase 2 开发前检查清单

在开始 Phase 2（合同集成）前，确认以下项目：

- [ ] `business_categories` 表已在数据库中创建（用户已确认 ✓）
- [ ] `/api/v1/business-categories` 接口可正常访问
- [ ] `getContractCount` 在 Phase 2 完成后实现真实查询
- [ ] 合同 Entity 新增 `business_category_id` 外键时，需要新的数据库迁移脚本
- [ ] 批量设置合同业务类型的接口需要事务支持（防止部分失败）
- [ ] 级联选择器（el-cascader）加载业务类型树时注意禁用节点的过滤逻辑

---

*Created: 2026-03-04*
*Last updated: 2026-03-04 after Phase 1 completion*
