# 订阅起始日期与时长推导实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans（内联执行）。步骤使用复选框（`- [ ]`）语法跟踪进度。

**目标：** 为订阅增加可为空的独立起始日期，并基于起始日期与当前到期日实时展示订阅时长，同时保持旧数据兼容。

**架构：** `subscription_records.start_date` 是可为空的业务字段；后端负责保存时校验起始日期不得晚于到期日期，前端负责编辑提示和实时展示。时长不落库，避免与 `renewal_period_value/unit` 重复；旧记录保持 `NULL`，不自动从历史记录猜测起始日期。

**技术栈：** Midway.js、TypeORM、Jest、Vue 3、Pinia、Element Plus、MySQL SQL migration、dayjs。

---

## 文件结构

- 修改：`apps/backend/src/entity/subscription-record.entity.ts`，增加可空 `start_date`。
- 修改：`apps/backend/src/interface.ts`，在创建和更新 DTO 增加 `start_date`。
- 修改：`apps/backend/src/service/subscription.service.ts`，保存日期、校验日期顺序、返回可选历史日期候选。
- 修改：`apps/backend/test/service/subscription.service.test.ts`，覆盖合法日期、逆序日期和 `NULL` 旧数据。
- 创建：`database/migrations/add_subscription_start_date.sql`，幂等增加 `start_date DATE NULL` 及套账索引。
- 修改：`database/migrations/create_subscription_tables.sql`，新库建表包含 `start_date`。
- 修改：`apps/frontend/src/api/types.ts`，增加 `start_date`。
- 修改：`apps/frontend/src/views/subscriptions/index.vue`，列表编辑/新增表单维护起始日期和本地校验。
- 修改：`apps/frontend/src/views/subscriptions/detail.vue`，详情编辑维护起始日期并展示实时订阅时长。
- 修改：`apps/frontend/src/stores/subscription.ts` 或 `apps/frontend/src/api/subscription.ts`，仅在需要候选日期接口时增加类型化调用；若采用详情已有记录数据生成提示，则不增加接口。

## 数据契约与业务规则

- `start_date` 类型：`DATE NULL`，前后端格式 `YYYY-MM-DD`。
- `current_expiry_date` 仍表示当前到期日；不改变其现有语义。
- `renewal_period_value/unit` 仍表示续费周期配置，不改名、不复用为订阅时长。
- 时长为派生展示值，不新增数据库列。
- `start_date IS NULL`：保存合法；列表和详情显示“未设置起始日期”，不显示猜测时长。
- `start_date > current_expiry_date`：后端返回 400 业务错误；前端在提交前阻止请求。
- 起始日期候选值：使用已有续费记录中最早的 `renewal_date` 作为“建议值”展示，但不自动写入；无日期记录时不显示建议。
- 日期推导：优先按日历年/月计算整年、整月，剩余部分按天显示；无法形成整月时显示天数。实现统一放在前端展示辅助函数，后端不持久化该字符串。

## 任务 1：后端契约、实体与迁移

**文件：**
- 修改：`apps/backend/src/entity/subscription-record.entity.ts`
- 修改：`apps/backend/src/interface.ts`
- 修改：`database/migrations/create_subscription_tables.sql`
- 创建：`database/migrations/add_subscription_start_date.sql`

- [ ] 在 `apps/backend/test/service/subscription.service.test.ts` 增加失败测试：创建和更新时保存 `start_date`；`NULL` 可保存。
- [ ] 运行 `cd apps/backend && npm test -- --runInBand service/subscription.service.test.ts`，确认新断言因字段尚未写入而失败。
- [ ] 在实体和 DTO 增加 `start_date?: string`/`start_date: string`，实体字段为 `Date | null`。
- [ ] 在新库建表 SQL 的 `current_expiry_date` 前增加 `start_date DATE NULL COMMENT '订阅起始日期'`，并增加 `(kit_id, start_date)` 索引。
- [ ] 创建幂等迁移：检查 `INFORMATION_SCHEMA.COLUMNS` 后增加 `start_date DATE NULL`；检查索引后增加 `idx_subscription_records_start_date (kit_id, start_date)`；不更新历史行。
- [ ] 运行后端测试确认保存和 `NULL` 断言通过。
- [ ] Commit：`feat(subscription): add nullable subscription start date`。

## 任务 2：后端保存校验与候选日期

**文件：**
- 修改：`apps/backend/src/service/subscription.service.ts`
- 修改：`apps/backend/src/controller/subscription.controller.ts`（仅在决定增加候选接口时）
- 修改：`apps/backend/test/service/subscription.service.test.ts`

- [ ] 增加失败测试：创建或更新时 `start_date` 晚于 `current_expiry_date` 抛出 `订阅起始日期不能晚于当前到期日`。
- [ ] 运行该测试确认失败原因是当前服务未校验日期。
- [ ] 在 `createSubscription` 和 `updateSubscription` 保存前调用同一私有校验逻辑；比较日期部分，不受时区时间影响；允许任一日期为空。
- [ ] 让错误在控制器现有错误响应中返回 400，不改变其他接口错误格式。
- [ ] 候选值优先由详情页已加载的续费记录计算，不新增接口：过滤非空 `renewal_date`，取最早日期，只作为前端 placeholder/提示，用户仍需主动填写。
- [ ] 运行后端订阅测试确认合法、逆序和 NULL 场景通过。
- [ ] Commit：`fix(subscription): validate subscription date range`。

## 任务 3：列表页表单与时长辅助函数

**文件：**
- 修改：`apps/frontend/src/api/types.ts`
- 修改：`apps/frontend/src/views/subscriptions/index.vue`
- 修改：`apps/frontend/src/views/subscriptions/detail.vue`

- [ ] 先在前端现有测试约定下增加可测试的时长辅助函数测试；若项目无前端测试框架，则把纯函数放入现有 `apps/frontend/src/utils`，用后端 Jest 不适合测试 UI，改以 TypeScript 构建和浏览器 smoke test 覆盖。
- [ ] 列表新增/编辑表单增加 `订阅起始日期` 日期选择器，初始值 `null`，`showEditDialog`/`resetForm` 正确回填和清空。
- [ ] 列表提交前校验 `start_date <= current_expiry_date`，与后端错误文案一致；旧数据为空时允许保存。
- [ ] 详情编辑表单增加同一字段和相同校验，避免两套规则漂移。
- [ ] 抽取单一时长辅助函数：空值返回 `未设置起始日期`；合法日期返回 `N 年 N 个月 N 天`，省略零项；`2026-09-13` 到 `2026-10-13` 返回 `1 个月`。
- [ ] 运行前端构建确认模板、类型和辅助函数通过编译。
- [ ] Commit：`feat(subscription): show duration from subscription dates`。

## 任务 4：详情页候选提示与旧数据兼容

**文件：**
- 修改：`apps/frontend/src/views/subscriptions/detail.vue`
- 修改：`apps/frontend/src/stores/subscription.ts`（仅当现有刷新流程需要调整）

- [ ] 详情加载续费记录后，计算最早非空 `renewal_date`，作为起始日期输入的说明或 placeholder：`建议起始日期：YYYY-MM-DD（来自最早续费记录）`。
- [ ] 不将候选日期写入 reactive form，不在保存时隐式提交候选值。
- [ ] `start_date = NULL` 的旧订阅详情显示“未设置起始日期”，编辑框保持空值。
- [ ] 浏览器验证：旧订阅打开编辑时起始日期为空；输入合法日期后显示推导时长；不输入时不影响原有到期日和续费周期。
- [ ] Commit：`fix(subscription): preserve legacy subscriptions without start date`。

## 任务 5：回归测试与最终验证

**文件：**
- 修改：`apps/backend/test/service/subscription.service.test.ts`
- 修改：`apps/backend/test/service/subscription-renewal-record.service.test.ts`（仅当历史候选数据需要覆盖）

- [ ] 增加边界测试：起始日等于到期日允许保存；起始日为空允许保存；旧数据的续费周期字段不因新增字段而变化。
- [ ] 运行：`cd apps/backend && npm test -- --runInBand service/subscription.service.test.ts service/subscription-renewal-record.service.test.ts`，预期全部通过。
- [ ] 运行：`cd apps/backend && npm run build`，预期退出码 0。
- [ ] 运行：`cd apps/frontend && npm run build`，预期退出码 0；允许已有 chunk size warning，不允许编译错误。
- [ ] 启动实际前后端，浏览器验证编辑、空值兼容、时长展示和逆序日期阻止提交。
- [ ] 最后检查仅包含本功能相关文件的工作区改动；不修改既有用户工作。
- [ ] Commit：`test(subscription): cover nullable start date behavior`。

## 规格覆盖度自检

- 后端实体、DTO、查询和保存：任务 1、2；TypeORM 查询自动带出实体字段。
- 数据库迁移：任务 1；新旧数据库分别覆盖。
- 列表和详情编辑表单：任务 3。
- 订阅详情时长展示：任务 3、4。
- 起止日期前后校验：任务 2、3。
- 前后端回归测试：任务 1、2、5；前端无测试框架时由构建和浏览器 smoke test 覆盖。
- 旧数据 NULL：任务 1、4、5。
- 最早历史日期候选：任务 2、4；不自动落库。

## 风险与明确取舍

- 不自动回填旧数据的 `start_date`，避免把补录日期误认为首次订阅日期。
- 不把派生时长保存到数据库，避免修改日期后产生两个事实来源。
- 不改变 `renewal_period_value/unit` 语义，避免影响提醒和续费逻辑。
- 月末日期采用日期差辅助函数的明确规则，测试必须覆盖普通整月和跨月非整月场景。
