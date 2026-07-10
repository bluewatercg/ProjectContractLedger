# 订阅提醒与续费归档实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将订阅台账改为同时维护当前到期日和下次提醒开始日，并将续费历史附件改为展开行统一管理。

**架构：** 在 `subscription_records` 增加 `next_reminder_start_date`，后端服务负责默认计算、推送判断和续费顺延。附件仍绑定 `subscription_renewal_logs`，新增删除接口。前端表单直接维护到期日和提醒开始日，续费历史通过展开行管理多份合同/发票。

**技术栈：** Midway.js、TypeORM、Jest、Vue 3、Pinia、Element Plus、MySQL SQL migration。

---

## 文件结构

- 修改：`apps/backend/src/entity/subscription-record.entity.ts`，新增 `next_reminder_start_date` 字段。
- 修改：`apps/backend/src/interface.ts`，补充后端 DTO 字段。
- 修改：`apps/backend/src/service/subscription.service.ts`，实现默认提醒日、推送算法、续费顺延。
- 修改：`apps/backend/src/service/subscription-renewal-attachment.service.ts`，完善附件删除语义。
- 修改：`apps/backend/src/controller/subscription.controller.ts`，新增附件删除接口。
- 修改：`apps/backend/test/service/subscription.service.test.ts`，覆盖提醒字段和推送算法。
- 创建：`database/migrations/add_subscription_next_reminder_start_date.sql`，为已有表补字段和历史默认值。
- 修改：`database/migrations/create_subscription_tables.sql`，新库建表包含字段。
- 修改：`apps/backend/package.json`，新增迁移脚本。
- 修改：`apps/frontend/src/api/types.ts`，增加前端类型字段。
- 修改：`apps/frontend/src/api/subscription.ts`，增加删除附件 API。
- 修改：`apps/frontend/src/stores/subscription.ts`，增加删除附件 action。
- 修改：`apps/frontend/src/views/subscriptions/index.vue`，表单维护当前到期日和下次提醒开始日。
- 修改：`apps/frontend/src/views/subscriptions/detail.vue`，详情展示提醒日，续费历史展开管理附件。

## 任务 1：后端提醒字段与算法

- [ ] 编写失败测试：创建事项默认生成 `next_reminder_start_date`、保留手工提醒日、允许逾期。
- [ ] 运行 `cd apps/backend && npm test -- test/service/subscription.service.test.ts --runInBand` 确认失败。
- [ ] 修改 entity、DTO、service，使测试通过。
- [ ] 运行测试确认通过。
- [ ] Commit：`feat(subscription): add next reminder date`。

## 任务 2：推送和续费顺延

- [ ] 编写失败测试：每日提醒使用 `next_reminder_start_date`，一次提醒只在提醒开始日推送，逾期继续推送，确认续费顺延提醒日。
- [ ] 运行后端单测确认失败。
- [ ] 修改 `getDueSubscriptionsForPush`、`shouldPushSubscription`、`renewSubscription`。
- [ ] 运行后端单测确认通过。
- [ ] Commit：`fix(subscription): use reminder start date`。

## 任务 3：附件删除接口和迁移

- [ ] 创建 SQL migration，历史数据按 `current_expiry_date - remind_days_before` 初始化。
- [ ] 更新 fresh schema 和 package script。
- [ ] 新增附件删除 API：`DELETE /api/v1/subscriptions/attachments/:attachmentId`。
- [ ] 运行后端 build。
- [ ] Commit：`feat(subscription): add attachment deletion`。

## 任务 4：前端表单和预览

- [ ] 更新类型和 API。
- [ ] 列表编辑表单展示“当前到期日”和“下次提醒开始日”。
- [ ] 预览按手工提醒日和到期日展示近 5 轮。
- [ ] 保存时发送两个日期，不再把提醒日伪装成到期日。
- [ ] 运行前端 build。
- [ ] Commit：`fix(subscription): edit expiry and reminder dates`。

## 任务 5：详情页展开行附件管理

- [ ] 详情页展示下次提醒开始日和提醒方式。
- [ ] 续费历史表增加展开行。
- [ ] 展开行列出所有附件，支持查看、下载、删除、上传合同、上传发票。
- [ ] 确认续费后刷新订阅详情和续费历史。
- [ ] 运行前端 build。
- [ ] Commit：`feat(subscription): manage renewal attachments inline`。

## 任务 6：最终验证

- [ ] 运行 `cd apps/backend && npm test -- test/service/subscription.service.test.ts --runInBand`。
- [ ] 运行 `cd apps/backend && npm run build`。
- [ ] 运行 `cd apps/frontend && npm run build`。
- [ ] 检查 git 状态，只提交相关文件。
- [ ] 推送 `origin midwayjs`。
