# 发票与开票计划双向挂钩设计

## 背景

合同台账中，开票计划描述“这份合同约定分几期开票、每期多少金额”，发票描述“实际开出了哪些票”。两者需要在台账里对齐，才能回答“第几期开完了、还差多少”。

改造前只有一条单向链路：`invoices.plan_id` 单列，只能在一张发票上指定一期计划。由此带来三个问题。

1. 反向不可达。计划侧看不到自己名下有哪些发票，也无法从计划出发去挂票。
2. 无法拆分。一张发票若覆盖多个期次，只能挂其中一期，其余无法表达。
3. 编辑态失效。发票表单里的计划下拉依赖合同详情返回的 `invoice_plans`，编辑模式回填时没有加载该列表，导致下拉框经常不显示；清空时前端传 `undefined`，后端凭 truthy 判断而忽略，等于清不掉。

因此改为两头发起、按金额分摊的关联模型。

## 目标

- 发票侧和计划侧都能独立发起挂钩，效果一致。
- 一张发票可以拆分到多个开票计划，每期计入的金额显式记录。
- 计划侧能反查已关联发票，并解绑单张发票。
- 计划的实际开票金额与状态只有一处计算口径。
- 存量数据可以无损迁移，且改动可回滚。

## 非目标

- 不做收款计划。收款仍以发票为唯一挂载点，`payments` 不增加 `plan_id`。
- 不改 `pay_ratio` 的语义。它仍是“用合同金额推算计划金额”的输入，不参与分摊。
- 不限制单期累计分摊超过计划金额（见“校验规则”）。
- 不做按比例自动分摊。分摊金额一律由用户显式填写。
- 不改报表 SQL。`actual_invoiced_amount` 仍是报表读取的字段，只调整其计算来源。

## 业务模型

### 分摊记录

沿用“关联即记录”的思路，建立发票与计划之间的多对多关系，并在关系上携带金额。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | int | 主键 |
| `kit_id` | int | 套账，用于隔离 |
| `invoice_id` | int | 发票 |
| `plan_id` | int | 开票计划 |
| `allocated_amount` | decimal(15,2) | 该发票计入该计划的金额 |
| `created_at` / `updated_at` | datetime(6) | 时间戳 |

约束：

- 唯一键 `(invoice_id, plan_id)`，同一张票不能重复挂同一期。
- `invoice_id` 外键级联删除，发票删除时分摊随删。
- `plan_id` 外键限制删除，计划删除前必须先解除分摊。

### 为什么显式记金额

备选的两种做法都不采用。

按比例自动分摊：金额由各期 `planned_amount` 比例推算。免填表，但计划金额一旦调整，历史分摊会被重算，审计上不可接受。

整票计入每一期：关联即视为整额。实现最简单，但一张 100 万的票挂到 60/40 两期，会让两期各计 100 万，计划口径与报表全部失真。

显式记录金额与既有的 `invoice_payment_allocations`（代付分摊）设计一致，团队无需学习新模式。

### 旧字段处置

`invoices.plan_id` 保留列，代码停止读写。保留而非 DROP，是为了出问题时能快速回滚；生产 `synchronize: false`，不映射即不会被框架改动。

## 关联规则

### 发起入口

两条入口对应同一份数据，任一侧操作后另一侧立即可见。

| 入口 | 位置 | 行为 |
| --- | --- | --- |
| 发票侧 | 发票新建/编辑表单的“开票计划分摊”子表 | 逐期填写金额，提交时整体替换该发票的分摊 |
| 计划侧 | 合同详情 · 开票计划页签 · 行内“关联发票”弹窗 | 勾选本合同发票并填写金额，保存时整体替换该计划的分摊 |

“整体替换”的含义：提交的集合即最终状态，未出现在提交集合中的既有分摊被解绑。这样可以避免增量接口带来的删除缺失问题。

### 校验规则

全部在事务内执行，计划行与分摊行加悲观写锁。

| 规则 | 处理 |
| --- | --- |
| 分摊金额必须大于 0 | 拒绝 |
| 同一票据不得重复、同票不得重复挂同期 | 拒绝 |
| 计划所属合同与发票不一致 | 拒绝 |
| 计划或发票跨套账 | 拒绝 |
| 发票已作废 | 拒绝新增分摊 |
| 计划已取消 | 拒绝新增分摊 |
| 单张发票分摊合计 > 发票总额 | 拒绝 |
| 单期累计分摊 > 计划金额 | 允许，状态置为已开票 |

最后一条是刻意的宽松：实务中存在先开票、后补计划的场景，硬性拦截会让业务卡住。代价是计划金额与实开可能不匹配，因此界面上对超额做标红提示，并由状态字段表达事实。

### 金额精度

统一保留两位小数进行比较，容差 0.01 元，避免 decimal 与浮点混算产生的分位误差误判。

## 状态重算

### 单一入口

所有路径收敛到 `InvoicePlanAllocationService.recalcPlan(planId, manager?)`。

原实现有两份重算逻辑：`ContractInvoicePlanService.recalcPlanAmountAndStatus` 与 `BadDebtService.recalcPlanStatus`。后者在“全部坏账”分支中没有更新 `actual_invoiced_amount`，行为与前者的分支覆盖也不一致。改造后前者委托给后者，`BadDebtService` 中的旧实现删除。

### 计算口径

```text
actual_invoiced_amount = Σ 分摊额（仅计未作废发票的分摊）

若全部贡献发票均为 bad_debt      -> bad_debt
否则 actual <= 0                 -> pending
否则 actual < planned_amount     -> partial_invoiced
否则                             -> invoiced
```

作废发票的分摊记录**保留**，只是不计入金额。这样发票恢复或审计追溯时信息完整。

### 触发点

| 场景 | 处理 |
| --- | --- |
| 新建发票并带分摊 | 写入分摊后重算涉及的全部计划 |
| 编辑发票的分摊 | 整体替换后重算旧、新计划 |
| 编辑发票的金额或税率 | 重算该发票涉及的全部计划 |
| 发票作废 | 重算该发票涉及的全部计划 |
| 发票删除 | 删除前记录涉及计划，删除后逐个重算 |
| 坏账标记 / 撤销 | 重算该发票涉及的全部计划 |
| 计划侧保存 / 解绑 | 重算该计划 |

多对多之下，“该发票涉及的全部计划”必须逐个重算，不能像旧实现那样只处理 `plan_id` 对应的单个计划。

## 后端改动

### 数据库

新增迁移 `apps/backend/migrations/003-invoice-plan-allocations.sql`：

1. 建表 `invoice_plan_allocations`。
2. 存量迁移：未作废发票的 `plan_id` 转为整额分摊，可重复执行。
3. 回填计划金额与状态。
4. 附带只读校验查询，用于上线后核对超额与跨合同脏数据。

### Entity 与 DTO

- 新增 `InvoicePlanAllocation` 实体。
- `Invoice` 移除 `plan_id` 字段与 `plan` 关系，改为 `plan_allocations` 一对多。
- `ContractInvoicePlan.invoices` 改为 `allocations`，经分摊表关联。
- `CreateInvoiceDto` / `UpdateInvoiceDto` 的 `plan_id` 替换为 `plan_allocations` 数组。
- 计划侧新增 `ReplacePlanAllocationsDto`。

### Service

新增 `InvoicePlanAllocationService`，对外方法：

| 方法 | 用途 |
| --- | --- |
| `replaceInvoiceAllocations` | 发票侧，事务内整体替换 |
| `replacePlanAllocations` | 计划侧，事务内整体替换 |
| `removeAllocation` | 计划侧解绑单张 |
| `getAllocationsByInvoice` / `getAllocationsByPlan` | 查询 |
| `getAllocatableInvoices` | 计划侧弹窗数据源，含剩余可分摊 |
| `recalcPlan` | 状态重算唯一入口 |
| `recalcPlansForInvoice` | 按发票批量重算 |
| `getPlanIdsForInvoice` | 删票前取受影响计划 |

### Controller

计划侧新增 4 个接口，挂在既有 `/api/v1/contracts` 下：

| 方法 | 路径 |
| --- | --- |
| GET | `/:contractId/invoice-plans/:planId/allocations` |
| PUT | `/:contractId/invoice-plans/:planId/allocations` |
| DELETE | `/:contractId/invoice-plans/:planId/allocations/:invoiceId` |
| GET | `/:contractId/invoice-plans/:planId/allocatable-invoices` |

发票侧不新增接口，复用创建/更新与详情返回。

## 前端改动

### 发票表单

“对应开票计划”单选下拉替换为“开票计划分摊”子表：每行一个期次，带启用开关与金额输入，底部实时显示已分摊、发票总额、未分摊。超额时标红并阻止提交。

选完合同即加载该合同全部计划；编辑模式进入时用发票详情的 `plan_allocations` 回填。整块交互被替换，前述“下拉不加载”“清空不生效”两个旧缺陷随之消失。

### 开票计划面板

- 新增“已分摊 / 计划”列，并排显示实际与计划，超额显示红色差额。
- 每行新增“关联发票”按钮，弹窗列出本合同未作废发票，显示发票总额、他处已分摊、本期计入、剩余可分摊，逐张填额后保存。
- 删除计划的提示文案改为“若已分摊发票会删除失败”。

## 错误处理

后端统一抛出可读中文错误，前端直接展示 message。典型文案：

- `分摊合计 ¥xxx 超过发票总额 ¥xxx，该票剩余可分摊 ¥xxx`
- `发票 XXX 不属于该合同`
- `开票计划「XXX」已分摊发票，无法删除，请先解除分摊`
- `同一张发票不能重复分摊到同一计划，或同一计划不能重复选择同一张发票`

唯一键 `(invoice_id, plan_id)` 作为并发兜底：两个请求同时插入同一对时，数据库拒绝，不会产生重复分摊。

## 测试计划

### 后端测试

新增 `test/service/invoice-plan-allocation.test.ts`，共 14 个用例，覆盖：

- 一票拆多期，两个计划都被重算
- 分摊合计超过发票总额被拒
- 同一提交内重复计划被拒
- 跨合同被拒、跨套账被拒
- 金额为 0 被拒
- 未提交的既有分摊被解绑
- 状态三档边界（未开票 / 部分开票 / 已开票）
- 超额仍置为已开票
- 作废发票不计入金额
- 全部坏账才标记 bad_debt
- 清空后回到 pending
- 计划侧保存时，发票不属于该合同被拒

### 前端验证

```bash
cd apps/frontend && npx vite build
```

`vue-tsc` 与当前 TypeScript 版本不兼容，改用构建验证。

### 后端验证

```bash
cd apps/backend && npx tsc --noEmit -p tsconfig.json
cd apps/backend && yarn test
```

## 交付与部署

需要数据库迁移。生产环境顺序：

1. 部署后端代码。
2. 执行迁移：`node scripts/run-sql-migration.js migrations/003-invoice-plan-allocations.sql`。
3. 部署前端代码。
4. 验证：合同详情计划页签的分摊列、计划侧关联弹窗、发票表单分摊子表、超额拦截。

迁移幂等，重复执行安全。脚本末尾的只读查询可用于核对超额与跨合同脏数据，正常应返回 0 行。

回滚方式：代码回退到改造前版本后，`invoices.plan_id` 保留的历史数据仍可读；新产生的分摊记录不会被旧版本识别。若确认放弃分摊数据，再删除 `invoice_plan_allocations` 表。
