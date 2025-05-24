-- MySQL数据库初始化脚本

-- 创建数据库
CREATE DATABASE IF NOT EXISTS procontractledger DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE procontractledger;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    email VARCHAR(100) NOT NULL COMMENT '电子邮箱',
    hashed_password VARCHAR(100) NOT NULL COMMENT '加密后的密码',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_username (username),
    UNIQUE KEY uk_email (email),
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户信息表';

-- 客户表
CREATE TABLE IF NOT EXISTS customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY COMMENT '客户ID',
    name VARCHAR(100) NOT NULL COMMENT '客户名称',
    contact_person VARCHAR(50) COMMENT '联系人',
    phone VARCHAR(20) COMMENT '联系电话',
    email VARCHAR(100) COMMENT '电子邮箱',
    address VARCHAR(200) COMMENT '地址',
    notes TEXT COMMENT '备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_name (name),
    INDEX idx_phone (phone),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户信息表';

-- 发票信息表
CREATE TABLE IF NOT EXISTS invoice_infos (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '发票信息ID',
    customer_id INT NOT NULL COMMENT '客户ID',
    company_name VARCHAR(100) NOT NULL COMMENT '公司名称',
    tax_number VARCHAR(50) COMMENT '税号',
    bank_name VARCHAR(100) COMMENT '开户银行',
    bank_account VARCHAR(50) COMMENT '银行账号',
    address VARCHAR(200) COMMENT '地址',
    phone VARCHAR(20) COMMENT '电话',
    is_default BOOLEAN DEFAULT FALSE COMMENT '是否默认',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    INDEX idx_customer_id (customer_id),
    INDEX idx_company_name (company_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='发票信息表';

-- 合同表
CREATE TABLE IF NOT EXISTS contracts (
    contract_id INT AUTO_INCREMENT PRIMARY KEY COMMENT '合同ID',
    customer_id INT NOT NULL COMMENT '客户ID',
    contract_number VARCHAR(50) NOT NULL COMMENT '合同编号',
    name VARCHAR(200) NOT NULL COMMENT '合同名称',
    amount DECIMAL(15,2) NOT NULL COMMENT '合同金额',
    start_date DATETIME NOT NULL COMMENT '开始日期',
    end_date DATETIME NOT NULL COMMENT '结束日期',
    status VARCHAR(20) NOT NULL COMMENT '状态：草稿、履行中、已完成、已逾期',
    notes TEXT COMMENT '备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    UNIQUE KEY uk_contract_number (contract_number),
    INDEX idx_customer_id (customer_id),
    INDEX idx_contract_number (contract_number),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='合同信息表';

-- 发票表
CREATE TABLE IF NOT EXISTS invoices (
    invoice_id INT AUTO_INCREMENT PRIMARY KEY COMMENT '发票ID',
    contract_id INT NOT NULL COMMENT '合同ID',
    invoice_info_id INT NOT NULL COMMENT '发票信息ID',
    invoice_number VARCHAR(50) NOT NULL COMMENT '发票号码',
    amount DECIMAL(15,2) NOT NULL COMMENT '发票金额',
    issue_date DATETIME NOT NULL COMMENT '开票日期',
    due_date DATETIME NOT NULL COMMENT '到期日期',
    status VARCHAR(20) NOT NULL COMMENT '状态：待开票、已开票、已收款',
    notes TEXT COMMENT '备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (contract_id) REFERENCES contracts(contract_id),
    FOREIGN KEY (invoice_info_id) REFERENCES invoice_infos(id),
    UNIQUE KEY uk_invoice_number (invoice_number),
    INDEX idx_contract_id (contract_id),
    INDEX idx_invoice_info_id (invoice_info_id),
    INDEX idx_invoice_number (invoice_number),
    INDEX idx_status (status),
    INDEX idx_dates (issue_date, due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='发票记录表';

-- 付款表
CREATE TABLE IF NOT EXISTS payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY COMMENT '付款ID',
    invoice_id INT NOT NULL COMMENT '发票ID',
    amount DECIMAL(15,2) NOT NULL COMMENT '付款金额',
    payment_date DATETIME NOT NULL COMMENT '付款日期',
    payment_method VARCHAR(50) NOT NULL COMMENT '付款方式',
    reference_number VARCHAR(50) COMMENT '参考号',
    notes TEXT COMMENT '备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id),
    INDEX idx_invoice_id (invoice_id),
    INDEX idx_payment_date (payment_date),
    INDEX idx_payment_method (payment_method)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='付款记录表';

-- 合同附件表
CREATE TABLE IF NOT EXISTS contract_attachments (
    attachment_id INT AUTO_INCREMENT PRIMARY KEY COMMENT '附件ID',
    contract_id INT NOT NULL COMMENT '合同ID',
    file_name VARCHAR(255) NOT NULL COMMENT '文件名',
    file_path VARCHAR(255) NOT NULL COMMENT '文件路径',
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
    FOREIGN KEY (contract_id) REFERENCES contracts(contract_id) ON DELETE CASCADE,
    INDEX idx_contract_id (contract_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='合同附件表';

-- 发票附件表
CREATE TABLE IF NOT EXISTS invoice_attachments (
    attachment_id INT AUTO_INCREMENT PRIMARY KEY COMMENT '附件ID',
    invoice_id INT NOT NULL COMMENT '发票ID',
    file_name VARCHAR(255) NOT NULL COMMENT '文件名',
    file_path VARCHAR(255) NOT NULL COMMENT '文件路径',
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    INDEX idx_invoice_id (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='发票附件表';

-- 沟通记录表
CREATE TABLE IF NOT EXISTS communications (
    communication_id INT AUTO_INCREMENT PRIMARY KEY COMMENT '沟通记录ID',
    customer_id INT NOT NULL COMMENT '客户ID',
    type VARCHAR(50) NOT NULL COMMENT '沟通类型',
    content TEXT NOT NULL COMMENT '沟通内容',
    contact_time DATETIME NOT NULL COMMENT '沟通时间',
    contact_person VARCHAR(50) NOT NULL COMMENT '联系人',
    notes TEXT COMMENT '备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    INDEX idx_customer_id (customer_id),
    INDEX idx_contact_time (contact_time),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户沟通记录表';

-- 提醒表
CREATE TABLE IF NOT EXISTS reminders (
    reminder_id INT AUTO_INCREMENT PRIMARY KEY COMMENT '提醒ID',
    contract_id INT NOT NULL COMMENT '合同ID',
    type VARCHAR(50) NOT NULL COMMENT '提醒类型',
    content TEXT NOT NULL COMMENT '提醒内容',
    remind_time DATETIME NOT NULL COMMENT '提醒时间',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '状态：pending-待处理, completed-已完成',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (contract_id) REFERENCES contracts(contract_id) ON DELETE CASCADE,
    INDEX idx_contract_id (contract_id),
    INDEX idx_remind_time (remind_time),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='合同提醒表';