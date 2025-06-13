# API 与数据库映射说明

本文档描述了客户合同管理系统 API 的核心资源/端点如何映射到数据库表和字段，以及部分 API 操作如何利用 `queries.sql` 中的预定义查询（如果适用）。

## 核心原则

- API 的数据模型 (`schemas` in `api_spec.yaml`) 直接反映或聚合自 `database/scripts/mysql_init.sql` 中定义的表结构。
- API 端点的设计尽可能高效地利用现有数据库结构和核心查询。
- 字段名在 API 和数据库之间保持一致性，除非有明确的转换逻辑（例如，`id` vs `customer_id`）。

## 映射详情

### 1. 用户 (Users)

- **API 资源**: `/users`, `/auth/login`, `/auth/me`
- **数据库表**: `users`
- **API Schemas**: `User`, `UserCreate`
- **字段映射**:
    - `User.id` -> `users.id` (PK)
    - `User.username` -> `users.username`
    - `User.email` -> `users.email`
    - `User.is_active` -> `users.is_active`
    - `User.created_at` -> `users.created_at`
    - `UserCreate.password` -> `users.hashed_password` (经过哈希处理)
- **核心查询利用**: 
    - 登录操作 (`/auth/login`) 可能利用 `queries.sql` 中的 `find_user_by_username_or_email` (如果存在类似查询)。
    - 用户创建和查询直接操作 `users` 表。

### 2. 客户 (Customers)

- **API 资源**: `/customers`, `/customers/{customerId}`
- **数据库表**: `customers`
- **API Schemas**: `Customer`, `CustomerCreate`, `CustomerUpdate`
- **字段映射**:
    - `Customer.customer_id` -> `customers.customer_id` (PK)
    - `Customer.name` -> `customers.name`
    - `Customer.contact_person` -> `customers.contact_person`
    - `Customer.phone` -> `customers.phone`
    - `Customer.email` -> `customers.email`
    - `Customer.address` -> `customers.address`
    - `Customer.notes` -> `customers.notes`
    - `Customer.created_at` -> `customers.created_at`
    - `Customer.updated_at` -> `customers.updated_at`
- **核心查询利用**: 
    - 列表查询 (`GET /customers`) 可能利用 `queries.sql` 中的 `get_all_customers_with_filter_and_pagination` (如果存在)。
    - 其他 CRUD 操作直接针对 `customers` 表。

### 3. 客户发票信息 (InvoiceInfos)

- **API 资源**: `/customers/{customerId}/invoice-infos`, `/customers/{customerId}/invoice-infos/{infoId}`
- **数据库表**: `invoice_infos`
- **API Schemas**: `InvoiceInfo`, `InvoiceInfoCreate`, `InvoiceInfoUpdate`
- **字段映射**:
    - `InvoiceInfo.id` -> `invoice_infos.id` (PK)
    - `InvoiceInfo.customer_id` -> `invoice_infos.customer_id` (FK to `customers`)
    - `InvoiceInfo.company_name` -> `invoice_infos.company_name`
    - `InvoiceInfo.tax_number` -> `invoice_infos.tax_number`
    - `InvoiceInfo.bank_name` -> `invoice_infos.bank_name`
    - `InvoiceInfo.bank_account` -> `invoice_infos.bank_account`
    - `InvoiceInfo.address` -> `invoice_infos.address`
    - `InvoiceInfo.phone` -> `invoice_infos.phone`
    - `InvoiceInfo.is_default` -> `invoice_infos.is_default`
    - `InvoiceInfo.created_at` -> `invoice_infos.created_at`
    - `InvoiceInfo.updated_at` -> `invoice_infos.updated_at`
- **核心查询利用**: 
    - 查询客户的发票信息列表 (`GET /customers/{customerId}/invoice-infos`) 会基于 `customer_id` 查询 `invoice_infos` 表。

### 4. 合同 (Contracts)

- **API 资源**: `/contracts`, `/contracts/{contractId}`
- **数据库表**: `contracts`
- **API Schemas**: `Contract`, `ContractCreate`, `ContractUpdate`
- **字段映射**:
    - `Contract.contract_id` -> `contracts.contract_id` (PK)
    - `Contract.customer_id` -> `contracts.customer_id` (FK to `customers`)
    - `Contract.contract_number` -> `contracts.contract_number`
    - `Contract.name` -> `contracts.name`
    - `Contract.amount` -> `contracts.amount`
    - `Contract.start_date` -> `contracts.start_date`
    - `Contract.end_date` -> `contracts.end_date`
    - `Contract.status` -> `contracts.status`
    - `Contract.notes` -> `contracts.notes`
    - `Contract.created_at` -> `contracts.created_at`
    - `Contract.updated_at` -> `contracts.updated_at`
- **核心查询利用**: 
    - 列表查询 (`GET /contracts`) 可能利用 `queries.sql` 中的 `get_contracts_with_filters` (如果存在)。
    - `queries.sql` 中的 `get_contract_details_by_id` 可用于 `GET /contracts/{contractId}`。

### 5. 发票 (Invoices)

- **API 资源**: `/invoices`, `/invoices/{invoiceId}`
- **数据库表**: `invoices`
- **API Schemas**: `Invoice`, `InvoiceCreate`, `InvoiceUpdate`
- **字段映射**:
    - `Invoice.invoice_id` -> `invoices.invoice_id` (PK)
    - `Invoice.contract_id` -> `invoices.contract_id` (FK to `contracts`)
    - `Invoice.invoice_info_id` -> `invoices.invoice_info_id` (FK to `invoice_infos`)
    - `Invoice.invoice_number` -> `invoices.invoice_number`
    - `Invoice.amount` -> `invoices.amount`
    - `Invoice.issue_date` -> `invoices.issue_date`
    - `Invoice.due_date` -> `invoices.due_date`
    - `Invoice.status` -> `invoices.status`
    - `Invoice.notes` -> `invoices.notes`
    - `Invoice.created_at` -> `invoices.created_at`
    - `Invoice.updated_at` -> `invoices.updated_at`
- **核心查询利用**: 
    - 列表查询 (`GET /invoices`) 可能利用 `queries.sql` 中的 `get_invoices_with_filters` (如果存在)。
    - `queries.sql` 中的 `get_invoice_details_by_id` 可用于 `GET /invoices/{invoiceId}`。
    - 创建发票时，可能需要查询关联的 `contracts` 和 `invoice_infos` 表以验证存在性。

### 6. 付款 (Payments)

- **API 资源**: `/payments`, `/payments/{paymentId}`
- **数据库表**: `payments`
- **API Schemas**: `Payment`, `PaymentCreate`, `PaymentUpdate`
- **字段映射**:
    - `Payment.payment_id` -> `payments.payment_id` (PK)
    - `Payment.invoice_id` -> `payments.invoice_id` (FK to `invoices`)
    - `Payment.amount` -> `payments.amount`
    - `Payment.payment_date` -> `payments.payment_date`
    - `Payment.payment_method` -> `payments.payment_method`
    - `Payment.reference_number` -> `payments.reference_number`
    - `Payment.notes` -> `payments.notes`
    - `Payment.created_at` -> `payments.created_at`
    - `Payment.updated_at` -> `payments.updated_at`
- **核心查询利用**: 
    - 列表查询 (`GET /payments`) 可能利用 `queries.sql` 中的 `get_payments_for_invoice` 或 `get_all_payments_with_filters` (如果存在)。
    - 创建付款时，会更新对应 `invoices` 表的收款状态，可能涉及 `queries.sql` 中的 `update_invoice_status_after_payment`。

### 7. 合同附件 (ContractAttachments)

- **API 资源**: `/contracts/{contractId}/attachments`, `/contracts/{contractId}/attachments/{attachmentId}`
- **数据库表**: `contract_attachments`
- **API Schemas**: `ContractAttachment`
- **字段映射**:
    - `ContractAttachment.attachment_id` -> `contract_attachments.attachment_id` (PK)
    - `ContractAttachment.contract_id` -> `contract_attachments.contract_id` (FK to `contracts`)
    - `ContractAttachment.file_name` -> `contract_attachments.file_name`
    - `ContractAttachment.file_path` -> `contract_attachments.file_path`
    - `ContractAttachment.file_type` -> `contract_attachments.file_type`
    - `ContractAttachment.file_size` -> `contract_attachments.file_size`
    - `ContractAttachment.uploaded_at` -> `contract_attachments.uploaded_at`
- **核心查询利用**: 
    - 主要为直接的 CRUD 操作。

### 8. 发票附件 (InvoiceAttachments)

- **API 资源**: `/invoices/{invoiceId}/attachments`, `/invoices/{invoiceId}/attachments/{attachmentId}`
- **数据库表**: `invoice_attachments`
- **API Schemas**: `InvoiceAttachment`
- **字段映射**:
    - `InvoiceAttachment.attachment_id` -> `invoice_attachments.attachment_id` (PK)
    - `InvoiceAttachment.invoice_id` -> `invoice_attachments.invoice_id` (FK to `invoices`)
    - `InvoiceAttachment.file_name` -> `invoice_attachments.file_name`
    - `InvoiceAttachment.file_path` -> `invoice_attachments.file_path`
    - `InvoiceAttachment.file_type` -> `invoice_attachments.file_type`
    - `InvoiceAttachment.file_size` -> `invoice_attachments.file_size`
    - `InvoiceAttachment.uploaded_at` -> `invoice_attachments.uploaded_at`
- **核心查询利用**: 
    - 主要为直接的 CRUD 操作。

### 9. 沟通记录 (Communications)

- **API 资源**: `/communications`, `/communications/{communicationId}`
- **数据库表**: `communications`
- **API Schemas**: `Communication`, `CommunicationCreate`, `CommunicationUpdate`
- **字段映射**:
    - `Communication.communication_id` -> `communications.communication_id` (PK)
    - `Communication.customer_id` -> `communications.customer_id` (FK to `customers`)
    - `Communication.contract_id` -> `communications.contract_id` (FK to `contracts`, nullable)
    - `Communication.type` -> `communications.type`
    - `Communication.content` -> `communications.content`
    - `Communication.contact_time` -> `communications.contact_time`
    - `Communication.contact_person` -> `communications.contact_person` (我方)
    - `Communication.customer_contact_person` -> `communications.customer_contact_person` (客户方, 对应数据库中的 `contact_person` 字段，但API中做了区分)
    - `Communication.notes` -> `communications.notes`
    - `Communication.created_at` -> `communications.created_at`
- **核心查询利用**: 
    - 列表查询 (`GET /communications`) 可能利用 `queries.sql` 中的 `get_communications_for_customer_or_contract` (如果存在)。

### 10. 提醒 (Reminders)

- **API 资源**: `/reminders`, `/reminders/{reminderId}`
- **数据库表**: `reminders`
- **API Schemas**: `Reminder`, `ReminderCreate`, `ReminderUpdate`
- **字段映射**:
    - `Reminder.reminder_id` -> `reminders.reminder_id` (PK)
    - `Reminder.user_id` -> `reminders.user_id` (FK to `users`)
    - `Reminder.contract_id` -> `reminders.contract_id` (FK to `contracts`, nullable)
    - `Reminder.invoice_id` -> `reminders.invoice_id` (FK to `invoices`, nullable)
    - `Reminder.type` -> `reminders.type`
    - `Reminder.content` -> `reminders.content`
    - `Reminder.remind_time` -> `reminders.remind_time`
    - `Reminder.status` -> `reminders.status`
    - `Reminder.created_at` -> `reminders.created_at`
    - `Reminder.updated_at` -> `reminders.updated_at`
- **核心查询利用**: 
    - 列表查询 (`GET /reminders`) 可能利用 `queries.sql` 中的 `get_reminders_for_user` (如果存在)。

## 注意事项

- **日期时间格式**: API 中所有 `date-time` 格式的字段，在数据库中通常存储为 `DATETIME` 或 `TIMESTAMP` 类型。前后端交互时需确保格式一致性 (通常为 ISO 8601)。
- **枚举值**: API 定义中的 `enum` 值应与数据库中对应字段的约束或业务逻辑保持一致。
- **分页与排序**: 列表查询接口 (`GET /resource`) 通常支持分页参数 (`page`, `page_size`) 和可能的排序参数。这些在数据库层面通过 `LIMIT`, `OFFSET`, 和 `ORDER BY` 实现。
- **事务处理**: 涉及多个数据表修改的操作 (如创建合同并关联发票) 应在后端通过数据库事务保证原子性。
- **权限控制**: API 端点的访问权限 (如某些接口仅管理员可用) 需要在后端业务逻辑中实现，并可能与 `users` 表的角色/权限字段关联。

本文档旨在提供一个高层次的映射概览。具体的 SQL 查询和业务逻辑将在后端服务实现中进一步细化。