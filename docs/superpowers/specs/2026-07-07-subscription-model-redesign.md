# 订阅台账模型重构设计

## 背景

当前订阅台账模型使用主表存储订阅事项和当前提醒信息，明细表仅作为历史归档。这种设计导致主表字段过多、提醒逻辑分散、续费信息与事项信息混淆。

现需重构为：主表只存储事项档案，明细表作为续费记录和提醒来源，每条明细可独立控制提醒时间，每个事项最多只有一条“生效中”明细。

## 目标

- 主表只保留事项基本信息，不存储续费相关字段。
- 明细表存储续费记录和提醒配置，成为唯一的提醒来源。
- 每个订阅事项最多只有一条“生效中”明细。
- 支持新增续费记录时自动切换当前生效明细。
- 附件绑定到具体的续费明细记录。

## 非目标

- 不保留“到期日”字段，只关注提醒开始日期。
- 不改变现有的 WeCom 推送机制，仅调整数据来源。
- 不做复杂的多提醒规则。

## 业务模型

### 主表：订阅事项档案

`subscription_records` 表只存储事项基本信息：

| 字段 | 描述 |
|------|------|
| id | 主键 |
| kit_id | 套账ID |
| name | 事项名称 |
| type_id | 事项类型ID |
| subject | 所属主体 |
| service_provider | 服务商 |
| owner_name | 主负责人 |
| cc_names | 其他负责人 |
| remarks | 备注 |
| status | 启用状态：active/inactive |
| created_at | 创建时间 |
| updated_at | 更新时间 |

移除字段：
- `current_expiry_date` - 当前到期日
- `next_reminder_start_date` - 下次提醒开始日
- `renewal_period_value` - 续费周期数值
- `renewal_period_unit` - 续费周期单位
- `remind_days_before` - 提前几天提醒
- `reminder_mode` - 提醒方式
- `fee` - 费用
- `renewal_url` - 续费方式

### 明细表：续费记录

新增 `subscription_renewal_records` 表存储续费记录和提醒配置：

| 字段 | 描述 |
|------|------|
| id | 主键 |
| subscription_id | 关联订阅事项ID |
| kit_id | 套账ID |
| renewal_date | 续费日期 |
| next_reminder_date | 下次提醒时间（开始提醒日期） |
| remind_days_before | 提前几天提醒（业务说明字段） |
| reminder_mode | 提醒方式：daily/once |
| fee | 费用 |
| renewal_method | 续费方式 |
| status | 状态：active/completed/voided |
| remarks | 备注 |
| operated_by | 操作人ID |
| created_at | 创建时间 |
| updated_at | 更新时间 |

状态说明：
- `active`：生效中，参与提醒推送
- `completed`：已完成，历史记录
- `voided`：已作废，录入错误的记录

### 附件表：续费附件

`subscription_renewal_attachments` 表保持不变，但关联字段从 `renewal_log_id` 改为 `renewal_record_id`：

| 字段 | 描述 |
|------|------|
| id | 主键 |
| renewal_record_id | 关联续费记录ID |
| kit_id | 套账ID |
| attachment_type | 附件类型：contract/invoice |
| filename | 文件名 |
| file_path | 文件路径 |
| uploaded_by | 上传人ID |
| uploaded_at | 上传时间 |

## 业务规则

### 新增续费记录

当用户新增一条续费记录时：

1. 检查当前订阅下是否有 `status = 'active'` 的记录
2. 如果有，则将其状态更新为 `completed`
3. 新记录的状态设置为 `active`
4. 返回新记录信息

### 提醒规则

提醒推送查询条件：

```sql
SELECT sr.*, srr.*
FROM subscription_records sr
JOIN subscription_renewal_records srr ON sr.id = srr.subscription_id
WHERE sr.status = 'active'
AND srr.status = 'active'
```

根据 `srr.next_reminder_date`、`srr.remind_days_before`、`srr.reminder_mode` 判断是否推送。

### 删除规则

- 删除 `completed` 或 `voided` 记录：直接删除记录及关联附件
- 删除 `active` 记录：
  1. 删除该记录及关联附件
  2. 查找最近的 `completed` 记录并将其状态更新为 `active`
  3. 如果没有 `completed` 记录，则该订阅事项不再参与提醒

## 数据迁移

### 1. 创建新表

```sql
CREATE TABLE subscription_renewal_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subscription_id INT NOT NULL,
  kit_id INT NOT NULL,
  renewal_date DATE,
  next_reminder_date DATE,
  remind_days_before INT DEFAULT 0,
  reminder_mode ENUM('daily', 'once') DEFAULT 'daily',
  fee DECIMAL(10,2),
  renewal_method VARCHAR(500),
  status ENUM('active', 'completed', 'voided') DEFAULT 'active',
  remarks TEXT,
  operated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_subscription_id (subscription_id),
  INDEX idx_kit_id (kit_id),
  INDEX idx_status (status)
);
```

### 2. 迁移现有数据

将现有 `subscription_records` 中的续费相关信息迁移到 `subscription_renewal_records`：

```sql
INSERT INTO subscription_renewal_records 
(subscription_id, kit_id, next_reminder_date, remind_days_before, reminder_mode, fee, renewal_method, status, remarks, operated_by, created_at, updated_at)
SELECT 
  id,
  kit_id,
  COALESCE(next_reminder_start_date, current_expiry_date) as next_reminder_date,
  COALESCE(remind_days_before, 0) as remind_days_before,
  COALESCE(reminder_mode, 'daily') as reminder_mode,
  fee,
  renewal_url as renewal_method,
  'active' as status,
  remarks,
  1 as operated_by, -- 默认操作人
  created_at,
  updated_at
FROM subscription_records
WHERE current_expiry_date IS NOT NULL OR next_reminder_start_date IS NOT NULL;
```

### 3. 删除主表字段

删除 `subscription_records` 中的续费相关字段。

### 4. 更新附件表关联

更新 `subscription_renewal_attachments` 表，将旧的 `renewal_log_id` 转换为 `renewal_record_id`。

## 后端改动

### Entity

- 新增 `SubscriptionRenewalRecord` Entity
- 修改 `SubscriptionRecord` Entity，移除续费相关字段
- 修改 `SubscriptionRenewalAttachment` Entity，更新关联关系

### Service

- 新增 `SubscriptionRenewalRecordService`
- 修改 `SubscriptionService`，调整提醒查询逻辑
- 修改 `SubscriptionRenewalAttachmentService`，更新关联关系

### Controller

- 修改 `SubscriptionController`，调整 API 接口
- 新增续费记录相关的增删改查接口

## 前端改动

### API

- 更新 `subscriptionApi`，新增续费记录相关接口

### Store

- 更新 `subscriptionStore`，新增续费记录相关方法

### View

- 修改 `detail.vue`，展示续费记录明细
- 修改 `index.vue`，新增续费记录表单

## 测试

- 编写新表的单元测试
- 编写数据迁移脚本的测试
- 更新现有订阅相关测试