# 数据库设计文档 - 客户合同管理系统

## 1. 文档信息

### 1.1 版本历史
| 版本号 | 日期 | 描述 |
|--------|------|------|
| v1.0   | 2024-01-24 | 初始版本 |

### 1.2 文档目的
本文档旨在详细说明客户合同管理系统的数据库设计方案，包括数据库选型、表结构设计、索引策略等内容，为系统开发和维护提供指导。

### 1.3 相关文档引用
- 产品需求文档 (PRD)
- 用户故事地图
- 流程图设计文档

## 2. 数据库选型

### 2.1 数据库类型选择
选择**关系型数据库**作为主要存储方案，原因如下：
- 系统数据之间存在明确的关系（如客户-合同-开票-到款的关联关系）
- 需要保证数据的一致性和完整性
- 需要支持复杂的查询和统计功能
- 数据结构相对固定，变化不频繁

### 2.2 具体数据库推荐
推荐使用 **MySQL**，原因如下：
- 支持多用户并发访问，可扩展性强
- 完善的事务支持，确保数据一致性
- 强大的查询优化器，提供高效的查询性能
- 丰富的数据类型和索引选项
- 广泛的社区支持和成熟的运维工具
- 支持主从复制，便于数据备份和读写分离

### 2.3 部署环境建议
- 推荐使用独立的MySQL服务器或云数据库服务
- 配置主从复制以支持数据备份
- 根据实际负载配置合适的服务器资源
- 建立完善的数据库备份策略
- 配置适当的连接池大小

## 3. 数据模型

### 3.1 概念数据模型

```mermaid
erDiagram
    Customer ||--o{ CustomerInvoiceInfo : has
    Customer ||--|| CustomerInvoiceInfo : "default invoice info"
    Customer ||--o{ Contract : has
    Contract ||--o{ Invoice : generates
    CustomerInvoiceInfo ||--o{ Invoice : "used for"
    Invoice ||--o{ Payment : receives
    Contract ||--o{ ContractAttachment : contains
    Invoice ||--o{ InvoiceAttachment : contains
    Customer ||--o{ Communication : has
    Contract ||--o{ Reminder : triggers

    Customer {
        INT customer_id PK
        VARCHAR(100) name
        VARCHAR(50) contact_person
        VARCHAR(20) phone
        VARCHAR(100) email
        VARCHAR(200) address
        TEXT notes
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    Contract {
        INT contract_id PK
        INT customer_id FK
        VARCHAR(50) contract_no
        VARCHAR(100) name
        DECIMAL(15,2) amount
        VARCHAR(3) currency
        DATE sign_date
        DATE effective_date
        DATE expiry_date
        VARCHAR(20) status
        TEXT main_terms
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    Invoice {
        INT invoice_id PK
        INT contract_id FK
        VARCHAR(50) invoice_no
        DECIMAL(15,2) amount
        VARCHAR(3) currency
        DATE issue_date
        DATE due_date
        VARCHAR(20) status
        TEXT notes
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    Payment {
        INT payment_id PK
        INT invoice_id FK
        DECIMAL(15,2) amount
        VARCHAR(3) currency
        DATE payment_date
        VARCHAR(50) payment_method
        TEXT notes
        VARCHAR(20) status
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    ContractAttachment {
        INT attachment_id PK
        INT contract_id FK
        VARCHAR(255) file_name
        VARCHAR(255) file_path
        TIMESTAMP uploaded_at
    }

    InvoiceAttachment {
        INT attachment_id PK
        INT invoice_id FK
        VARCHAR(255) file_name
        VARCHAR(255) file_path
        TIMESTAMP uploaded_at
    }

    Communication {
        INT communication_id PK
        INT customer_id FK
        VARCHAR(50) type
        TEXT content
        DATETIME contact_time
        VARCHAR(50) contact_person
        TEXT notes
        TIMESTAMP created_at
    }

    Reminder {
        INT reminder_id PK
        INT contract_id FK
        VARCHAR(50) type
        TEXT content
        DATETIME remind_time
        VARCHAR(20) status
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
```

### 3.2 逻辑数据模型

#### 客户表 (customers)
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| customer_id | INT UNSIGNED | PRIMARY KEY AUTO_INCREMENT | 客户ID |
| name | VARCHAR(100) | NOT NULL | 客户名称 |
| contact_person | VARCHAR(50) | NOT NULL | 联系人 |
| phone | VARCHAR(20) | | 联系电话 |
| email | VARCHAR(100) | | 电子邮箱 |
| address | VARCHAR(200) | | 地址 |
| default_invoice_info_id | INT UNSIGNED | FOREIGN KEY (default_invoice_info_id) REFERENCES customer_invoice_infos(invoice_info_id) | 默认开票信息ID |
| notes | TEXT | | 备注 |
| created_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

#### 合同表 (contracts)
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| contract_id | INT UNSIGNED | PRIMARY KEY AUTO_INCREMENT | 合同ID |
| customer_id | INT UNSIGNED | NOT NULL, FOREIGN KEY (customer_id) REFERENCES customers(customer_id) | 客户ID |
| contract_no | VARCHAR(50) | NOT NULL UNIQUE | 合同编号 |
| name | VARCHAR(100) | NOT NULL | 合同名称 |
| amount | DECIMAL(15,2) | NOT NULL | 合同金额 |
| currency | VARCHAR(3) | NOT NULL DEFAULT 'CNY' | 币种 |
| sign_date | DATE | NOT NULL | 签署日期 |
| effective_date | DATE | NOT NULL | 生效日期 |
| expiry_date | DATE | | 到期日期 |
| status | VARCHAR(20) | NOT NULL DEFAULT 'draft' | 状态(draft/signed/active/completed/archived/void) |
| main_terms | TEXT | | 主要条款 |
| created_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

#### 开票记录表 (invoices)
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| invoice_id | INT UNSIGNED | PRIMARY KEY AUTO_INCREMENT | 发票ID |
| contract_id | INT UNSIGNED | NOT NULL, FOREIGN KEY (contract_id) REFERENCES contracts(contract_id) | 合同ID |
| invoice_info_id | INT UNSIGNED | FOREIGN KEY (invoice_info_id) REFERENCES customer_invoice_infos(invoice_info_id) | 开票信息ID |
| invoice_no | VARCHAR(50) | UNIQUE | 发票编号 |
| amount | DECIMAL(15,2) | NOT NULL | 开票金额 |
| currency | VARCHAR(3) | NOT NULL DEFAULT 'CNY' | 币种 |
| issue_date | DATE | | 开票日期 |
| due_date | DATE | | 到期日期 |
| status | VARCHAR(20) | NOT NULL DEFAULT 'pending' | 状态(pending/issued/mailed/received/void) |
| notes | TEXT | | 备注 |
| created_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

#### 客户开票信息表 (customer_invoice_infos)
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| invoice_info_id | INT UNSIGNED | PRIMARY KEY AUTO_INCREMENT | 开票信息ID |
| customer_id | INT UNSIGNED | NOT NULL, FOREIGN KEY (customer_id) REFERENCES customers(customer_id) | 客户ID |
| title | VARCHAR(100) | NOT NULL | 发票抬头 |
| tax_number | VARCHAR(50) | | 纳税人识别号 |
| bank_name | VARCHAR(100) | | 开户银行 |
| bank_account | VARCHAR(50) | | 银行账号 |
| address | VARCHAR(200) | | 地址 |
| phone | VARCHAR(20) | | 电话 |
| is_default | TINYINT(1) | NOT NULL DEFAULT 0 | 是否默认开票信息(0-否，1-是) |
| created_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

#### 到款记录表 (payments)
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| payment_id | INT UNSIGNED | PRIMARY KEY AUTO_INCREMENT | 付款ID |
| invoice_id | INT UNSIGNED | NOT NULL, FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) | 发票ID |
| amount | DECIMAL(15,2) | NOT NULL | 付款金额 |
| currency | VARCHAR(3) | NOT NULL DEFAULT 'CNY' | 币种 |
| payment_date | DATE | NOT NULL | 付款日期 |
| payment_method | VARCHAR(50) | | 付款方式 |
| notes | TEXT | | 备注 |
| status | VARCHAR(20) | NOT NULL DEFAULT 'received' | 状态(received/verified) |
| created_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

#### 合同附件表 (contract_attachments)
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| attachment_id | INT UNSIGNED | PRIMARY KEY AUTO_INCREMENT | 附件ID |
| contract_id | INT UNSIGNED | NOT NULL, FOREIGN KEY (contract_id) REFERENCES contracts(contract_id) | 合同ID |
| file_name | VARCHAR(255) | NOT NULL | 文件名 |
| file_path | VARCHAR(255) | NOT NULL | 文件路径 |
| uploaded_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP | 上传时间 |

#### 发票附件表 (invoice_attachments)
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| attachment_id | INT UNSIGNED | PRIMARY KEY AUTO_INCREMENT | 附件ID |
| invoice_id | INT UNSIGNED | NOT NULL, FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) | 发票ID |
| file_name | VARCHAR(255) | NOT NULL | 文件名 |
| file_path | VARCHAR(255) | NOT NULL | 文件路径 |
| uploaded_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP | 上传时间 |

#### 沟通记录表 (communications)
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| communication_id | INT UNSIGNED | PRIMARY KEY AUTO_INCREMENT | 沟通记录ID |
| customer_id | INT UNSIGNED | NOT NULL, FOREIGN KEY (customer_id) REFERENCES customers(customer_id) | 客户ID |
| type | VARCHAR(50) | NOT NULL | 沟通类型 |
| content | TEXT | NOT NULL | 沟通内容 |
| contact_time | DATETIME | NOT NULL | 沟通时间 |
| contact_person | VARCHAR(50) | NOT NULL | 联系人 |
| notes | TEXT | | 备注 |
| created_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |

#### 提醒表 (reminders)
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| reminder_id | INT UNSIGNED | PRIMARY KEY AUTO_INCREMENT | 提醒ID |
| contract_id | INT UNSIGNED | NOT NULL, FOREIGN KEY (contract_id) REFERENCES contracts(contract_id) | 合同ID |
| type | VARCHAR(50) | NOT NULL | 提醒类型 |
| content | TEXT | NOT NULL | 提醒内容 |
| remind_time | DATETIME | NOT NULL | 提醒时间 |
| status | VARCHAR(20) | NOT NULL DEFAULT 'pending' | 状态(pending/done/cancelled) |
| created_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

### 3.3 物理数据模型

#### 存储引擎
使用 SQLite 默认的存储引擎。

#### 字符集和排序规则
- 字符集：UTF-8
- 排序规则：BINARY

## 4. 索引策略

### 4.1 主索引
所有表都使用自增的整数主键。

### 4.2 辅助索引

#### customers 表
- idx_customer_name：客户名称索引 (name)
- idx_customer_phone：电话索引 (phone)
- idx_customer_email：邮箱索引 (email)

#### contracts 表
- idx_contract_customer：客户ID索引 (customer_id)
- idx_contract_no：合同编号索引 (contract_no)
- idx_contract_status：合同状态索引 (status)
- idx_contract_dates：合同日期复合索引 (sign_date, effective_date, expiry_date)

#### invoices 表
- idx_invoice_contract：合同ID索引 (contract_id)
- idx_invoice_no：发票编号索引 (invoice_no)
- idx_invoice_status：发票状态索引 (status)
- idx_invoice_dates：发票日期复合索引 (issue_date, due_date)

#### payments 表
- idx_payment_invoice：发票ID索引 (invoice_id)
- idx_payment_date：付款日期索引 (payment_date)
- idx_payment_status：付款状态索引 (status)

#### communications 表
- idx_communication_customer：客户ID索引 (customer_id)
- idx_communication_time：沟通时间索引 (contact_time)

#### reminders 表
- idx_reminder_contract：合同ID索引 (contract_id)
- idx_reminder_time：提醒时间索引 (remind_time)
- idx_reminder_status：提醒状态索引 (status)

## 5. 数据访问模式

### 5.1 核心查询场景

#### 客户管理
```sql
-- 查询客户列表（带合同数量统计）
SELECT 
    c.*,
    COUNT(DISTINCT ct.contract_id) as contract_count
FROM customers c
LEFT JOIN contracts ct ON c.customer_id = ct.customer_id
GROUP BY c.customer_id;

-- 查询客户详情（带最近合同）
SELECT 
    c.*,
    ct.contract_no,
    ct.name as contract_name,
    ct.status as contract_status
FROM customers c
LEFT JOIN contracts ct ON c.customer_id = ct.customer_id
WHERE c.customer_id = ?;
```

#### 合同管理
```sql
-- 查询合同列表（带客户信息和金额统计）
SELECT 
    ct.*,
    c.name as customer_name,
    c.contact_person,
    SUM(p.amount) as total_paid_amount
FROM contracts ct
JOIN customers c ON ct.customer_id = c.customer_id
LEFT JOIN invoices i_for_sum ON ct.contract_id = i_for_sum.contract_id
LEFT JOIN payments p ON i_for_sum.invoice_id = p.invoice_id
GROUP BY ct.contract_id;

-- 查询合同详情（带开票和付款信息）
SELECT 
    ct.*,
    c.name as customer_name,
    i.invoice_no,
    i.amount as invoice_amount,
    i.status as invoice_status,
    p.amount as payment_amount,
    p.payment_date
FROM contracts ct
JOIN customers c ON ct.customer_id = c.customer_id
LEFT JOIN invoices i ON ct.contract_id = i.contract_id
LEFT JOIN payments p ON i.invoice_id = p.invoice_id
WHERE ct.contract_id = ?;
```

#### 开票管理
```sql
-- 查询开票列表（带合同、客户和开票信息）
SELECT 
    i.*,
    ct.contract_no,
    ct.name as contract_name,
    c.name as customer_name,
    ci.title as invoice_title,
    ci.tax_number
FROM invoices i
JOIN contracts ct ON i.contract_id = ct.contract_id
JOIN customers c ON ct.customer_id = c.customer_id
LEFT JOIN customer_invoice_infos ci ON i.invoice_info_id = ci.invoice_info_id;
```

#### 到款管理
```sql
-- 查询到款列表（带发票、合同和客户信息）
SELECT 
    p.*,
    i.invoice_no,
    ct.contract_no,
    ct.name as contract_name,
    c.name as customer_name
FROM payments p
JOIN invoices i ON p.invoice_id = i.invoice_id
JOIN contracts ct ON i.contract_id = ct.contract_id
JOIN customers c ON ct.customer_id = c.customer_id;
```

### 5.2 数据统计查询
```sql
-- 合同金额统计
SELECT 
    COUNT(*) as contract_count,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount
FROM contracts
WHERE status = 'active';

-- 收款情况统计
SELECT 
    ct.contract_id,
    ct.amount as contract_amount,
    SUM(p.amount) as paid_amount,
    (ct.amount - COALESCE(SUM(p.amount), 0)) as remaining_amount
FROM contracts ct
LEFT JOIN invoices i_for_stats ON ct.contract_id = i_for_stats.contract_id
LEFT JOIN payments p ON i_for_stats.invoice_id = p.invoice_id
GROUP BY ct.contract_id;
```

## 6. 性能与扩展性

### 6.1 性能估算
- 预计数据量
  - 客户：数百条记录
  - 合同：数千条记录
  - 开票/到款记录：数千条记录
  - 附件：数千个文件
- SQLite 完全能够支持此数据量
- 单用户访问，无并发问题

### 6.2 性能优化建议
- 定期执行 VACUUM 操作，回收空间
- 定期清理过期的临时文件
- 合理使用事务，确保数据一致性
- 避免大量数据的一次性操作

## 7. 安全与合规

### 7.1 数据安全
- 定期备份数据库文件
- 使用文件系统权限保护数据库文件
- 敏感信息（如金额）使用 DECIMAL 类型确保精确性

### 7.2 数据完整性
- 使用外键约束确保数据关联的完整性
- 使用触发器自动更新时间戳
- 使用事务确保操作的原子性

## 8. 数据迁移与初始化

### 8.1 初始化脚本
将在单独的 SQL 文件中提供：
- 表结构创建脚本
- 索引创建脚本
- 初始数据插入脚本

### 8.2 数据迁移策略
- 提供数据导出功能（CSV格式）
- 提供数据导入功能
- 版本升级时提供迁移脚本

### 8.3 备份与恢复策略
- **备份策略**:
  - **定期备份**: 每日进行数据库文件完整备份。
  - **备份存储**: 备份文件存储在与主数据库物理隔离的安全位置，例如另一台服务器或云存储。
  - **备份保留策略**: 至少保留最近7天的每日备份，以及最近4周的每周备份和最近3个月的每月备份。
- **恢复策略**:
  - **恢复时间目标 (RTO)**: 定义系统中断后恢复服务所需的最长时间（例如，4小时内）。
  - **恢复点目标 (RPO)**: 定义可容忍的最大数据丢失量（例如，不超过1小时的数据）。
  - **恢复测试**: 定期（例如每季度）进行恢复演练，确保备份的有效性和恢复流程的顺畅性。

## 9. 维护与监控

### 9.1 数据库监控指标
- **慢查询日志**: 监控并分析执行时间超过阈值的查询，识别性能瓶颈。
- **连接数**: 监控当前数据库连接数，确保未超出限制。
- **存储使用率**: 监控磁盘空间使用情况，及时预警空间不足。
- **CPU/内存使用率**: 监控数据库服务器的系统资源使用情况。
- **I/O 性能**: 监控磁盘读写性能。
- **错误日志**: 定期检查数据库错误日志，及时发现并处理问题。

### 9.2 维护任务
- **索引重建/重组**: 定期（例如每月或根据索引碎片化程度）对索引进行重建或重组，以提高查询性能。
- **数据清理/归档**: 根据业务需求，定期清理不再需要的旧数据或将其归档到历史数据库，以控制主数据库的大小。
- **统计信息更新**: 定期更新数据库的统计信息（例如 SQLite 的 `ANALYZE` 命令），以帮助查询优化器生成更优的执行计划。
- **数据库版本升级与补丁**: 关注数据库厂商发布的安全补丁和版本更新，及时评估并进行升级。
- **日志管理**: 定期清理或归档数据库事务日志和错误日志，防止磁盘空间耗尽。