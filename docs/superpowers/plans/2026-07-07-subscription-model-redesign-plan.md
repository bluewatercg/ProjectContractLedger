# 订阅台账模型重构实现计划

## 目标

将订阅台账模型从主表存储续费信息改为明细表存储续费记录和提醒来源，实现主表只存事项档案、明细表唯一控制提醒的架构。

## 风险

- 数据迁移可能导致历史数据丢失
- 提醒逻辑变更可能中断推送
- 前端页面重构可能引入新bug
- 需要确保 Kit 隔离仍然有效

## 步骤

### 1. 创建新表结构 (Day 1)

- [ ] 创建 `subscription_renewal_records` 表
- [ ] 添加必要的索引和约束
- [ ] 更新 `subscription_renewal_attachments` 表结构（添加 `renewal_record_id` 字段）

### 2. 数据迁移 (Day 1)

- [ ] 编写数据迁移脚本，将现有续费信息从主表迁移到明细表
- [ ] 运行迁移脚本
- [ ] 验证迁移数据的完整性

### 3. 更新 Entity (Day 2)

- [ ] 创建 `SubscriptionRenewalRecord` Entity
- [ ] 修改 `SubscriptionRecord` Entity，移除续费相关字段
- [ ] 更新 `SubscriptionRenewalAttachment` Entity，添加 `renewal_record_id` 关系

### 4. 更新 Service (Day 2-3)

- [ ] 创建 `SubscriptionRenewalRecordService`
- [ ] 修改 `SubscriptionService`，调整提醒查询逻辑
- [ ] 修改 `SubscriptionRenewalAttachmentService`，更新关联关系

### 5. 更新 Controller (Day 3)

- [ ] 修改 `SubscriptionController`，调整 API 接口
- [ ] 新增续费记录相关的增删改查接口

### 6. 更新前端 API/Store (Day 3)

- [ ] 更新 `subscriptionApi`，新增续费记录相关接口
- [ ] 更新 `subscriptionStore`，新增续费记录相关方法

### 7. 更新前端视图 (Day 4)

- [ ] 修改 `detail.vue`，展示续费记录明细
- [ ] 修改 `index.vue`，新增续费记录表单
- [ ] 调整页面布局和交互逻辑

### 8. 测试 (Day 4-5)

- [ ] 编写新表的单元测试
- [ ] 更新现有订阅相关测试
- [ ] 运行所有测试确保功能正常

### 9. 验证 (Day 5)

- [ ] 验证提醒推送功能正常
- [ ] 验证新增续费记录功能正常
- [ ] 验证附件上传下载功能正常
- [ ] 验证数据隔离正常

## 依赖

- 步骤 1 完成后才能进行步骤 2
- 步骤 2 完成后才能进行步骤 3
- 步骤 3 完成后才能进行步骤 4
- 步骤 4 完成后才能进行步骤 5
- 步骤 5 完成后才能进行步骤 6
- 步骤 6 完成后才能进行步骤 7

## 成功标准

- 所有测试通过
- 提醒推送功能正常
- 前后端功能完整
- 数据迁移无丢失
- Kit 隔离正常