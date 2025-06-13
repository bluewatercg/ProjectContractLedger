# 数据库设计更新文档 - 客户合同管理系统

## 1. 文档信息

### 1.1 版本历史
| 版本号 | 日期 | 描述 |
|--------|------|------|
| v1.1   | 2024-05-15 | 更新客户开票信息相关表结构 |

### 1.2 文档目的
本文档旨在说明客户合同管理系统数据库设计的更新内容，主要涉及客户开票信息相关表结构的调整。

## 2. 数据模型更新

### 2.1 新增表结构

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

### 2.2 表结构修改

#### 客户表 (customers) 修改
添加默认开票信息ID字段：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| default_invoice_info_id | INT UNSIGNED | FOREIGN KEY (default_invoice_info_id) REFERENCES customer_invoice_infos(invoice_info_id) | 默认开票信息ID |

#### 开票记录表 (invoices) 修改
添加开票信息ID字段：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| invoice_info_id | INT UNSIGNED | FOREIGN KEY (invoice_info_id) REFERENCES customer_invoice_infos(invoice_info_id) | 开票信息ID |

### 2.3 数据关系图更新

```mermaid
entityRelationshipDiagram
  customers ||--o{ customer_invoice_infos : "拥有"
  customers ||--|| customer_invoice_infos : "默认开票信息"
  customers ||--o{ contracts : "拥有"
  contracts ||--o{ invoices : "关联"
  customer_invoice_infos ||--o{ invoices : "用于"
  invoices ||--o{ payments : "关联"
```

## 3. SQL变更脚本

```sql
-- 创建客户开票信息表
CREATE TABLE customer_invoice_infos (
  invoice_info_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id INT UNSIGNED NOT NULL,
  title VARCHAR(100) NOT NULL,
  tax_number VARCHAR(50),
  bank_name VARCHAR(100),
  bank_account VARCHAR(50),
  address VARCHAR(200),
  phone VARCHAR(20),
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- 修改客户表，添加默认开票信息ID字段
ALTER TABLE customers
ADD COLUMN default_invoice_info_id INT UNSIGNED,
ADD CONSTRAINT fk_customer_default_invoice_info
FOREIGN KEY (default_invoice_info_id) REFERENCES customer_invoice_infos(invoice_info_id);

-- 修改发票表，添加开票信息ID字段
ALTER TABLE invoices
ADD COLUMN invoice_info_id INT UNSIGNED,
ADD CONSTRAINT fk_invoice_invoice_info
FOREIGN KEY (invoice_info_id) REFERENCES customer_invoice_infos(invoice_info_id);
```

## 4. 数据访问模式更新

### 4.1 核心查询场景

#### 客户开票信息管理
```sql
-- 查询客户的所有开票信息
SELECT * FROM customer_invoice_infos WHERE customer_id = ?;

-- 查询客户的默认开票信息
SELECT ci.* 
FROM customer_invoice_infos ci
JOIN customers c ON ci.invoice_info_id = c.default_invoice_info_id
WHERE c.customer_id = ?;

-- 查询发票的开票信息
SELECT ci.*
FROM customer_invoice_infos ci
JOIN invoices i ON ci.invoice_info_id = i.invoice_info_id
WHERE i.invoice_id = ?;
```

#### 开票管理（更新）
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

## 5. 数据迁移说明

1. 创建客户开票信息表后，需要为现有客户创建默认开票信息记录。
2. 更新客户表中的默认开票信息ID字段，关联到新创建的开票信息记录。
3. 更新发票表中的开票信息ID字段，关联到对应客户的开票信息记录。

## 6. 影响分析

1. 客户管理模块需要增加开票信息管理功能。
2. 开票管理模块需要修改，支持选择客户的开票信息。
3. 现有的开票查询和统计功能需要更新，以包含开票信息相关字段。
4. 到款管理模块不受影响，因为已经正确关联到发票表。