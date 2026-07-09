-- Migration: create_subscription_tables
-- Date: 2026-07-07
-- Description: Create subscription ledger, type dictionary, renewal history, and push deduplication tables

CREATE TABLE IF NOT EXISTS subscription_types (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  kit_id INT NOT NULL COMMENT '套账ID',
  name VARCHAR(50) NOT NULL COMMENT '事项类型名称',
  code VARCHAR(50) NOT NULL COMMENT '事项类型编码，套账内唯一',
  is_default BOOLEAN DEFAULT FALSE COMMENT '是否为系统预置类型',
  sort_order INT DEFAULT 0 COMMENT '排序序号',
  status ENUM('active', 'disabled') DEFAULT 'active' COMMENT '状态：active-启用，disabled-禁用',
  created_by INT NOT NULL COMMENT '创建人ID',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  CONSTRAINT fk_subscription_types_kit FOREIGN KEY (kit_id) REFERENCES kits(id),
  CONSTRAINT fk_subscription_types_creator FOREIGN KEY (created_by) REFERENCES users(id),

  UNIQUE KEY uk_subscription_types_kit_code (kit_id, code),
  INDEX idx_subscription_types_kit_status (kit_id, status),
  INDEX idx_subscription_types_sort_order (kit_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订阅事项类型字典表';

CREATE TABLE IF NOT EXISTS subscription_records (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  kit_id INT NOT NULL COMMENT '套账ID',
  type_id INT NOT NULL COMMENT '事项类型ID',
  name VARCHAR(200) NOT NULL COMMENT '事项名称',
  subject VARCHAR(200) NOT NULL COMMENT '主体：账号/域名/公司名',
  provider VARCHAR(100) NULL COMMENT '供应商/服务商',
  renewal_url VARCHAR(500) NULL COMMENT '续费入口URL',
  current_expiry_date DATE NOT NULL COMMENT '当前到期日',
  renewal_period_value INT NOT NULL COMMENT '续费周期数值',
  renewal_period_unit ENUM('day', 'month', 'year') NOT NULL COMMENT '续费周期单位：day-天，month-月，year-年',
  remind_days_before INT NOT NULL DEFAULT 30 COMMENT '提前提醒天数',
  reminder_mode ENUM('once', 'daily') NOT NULL DEFAULT 'daily' COMMENT '提醒方式：once-仅提醒一次，daily-到期前每日提醒',
  owner_name VARCHAR(100) NULL COMMENT '主负责人名称（非系统用户）',
  owner_user_id INT NULL COMMENT '历史主负责人用户ID，可为空',
  cc_user_ids VARCHAR(500) NULL COMMENT '历史抄送人ID列表，逗号分隔',
  cc_names VARCHAR(500) NULL COMMENT '其他负责人名称，手工输入',
  fee DECIMAL(15,2) NULL COMMENT '年费/单次费用',
  notes TEXT NULL COMMENT '备注',
  status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态：active-启用，inactive-停用',
  created_by INT NOT NULL COMMENT '创建人ID',
  updated_by INT NULL COMMENT '最后更新人ID',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  CONSTRAINT fk_subscription_records_kit FOREIGN KEY (kit_id) REFERENCES kits(id),
  CONSTRAINT fk_subscription_records_type FOREIGN KEY (type_id) REFERENCES subscription_types(id) ON DELETE RESTRICT,
  CONSTRAINT fk_subscription_records_owner FOREIGN KEY (owner_user_id) REFERENCES users(id),
  CONSTRAINT fk_subscription_records_creator FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_subscription_records_updater FOREIGN KEY (updated_by) REFERENCES users(id),

  INDEX idx_subscription_records_kit_status (kit_id, status),
  INDEX idx_subscription_records_kit_type (kit_id, type_id),
  INDEX idx_subscription_records_expiry (kit_id, current_expiry_date),
  INDEX idx_subscription_records_owner (kit_id, owner_user_id),
  INDEX idx_subscription_records_owner_name (kit_id, owner_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订阅台账表';

CREATE TABLE IF NOT EXISTS subscription_renewal_logs (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  subscription_id INT NOT NULL COMMENT '订阅ID',
  kit_id INT NOT NULL COMMENT '套账ID',
  previous_expiry_date DATE NOT NULL COMMENT '上一到期日',
  new_expiry_date DATE NOT NULL COMMENT '新到期日',
  renewal_period_value INT NOT NULL COMMENT '续费周期数值',
  renewal_period_unit ENUM('day', 'month', 'year') NOT NULL COMMENT '续费周期单位',
  operated_by INT NOT NULL COMMENT '操作人ID',
  operated_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  remarks VARCHAR(500) NULL COMMENT '备注',

  CONSTRAINT fk_subscription_renewal_logs_subscription FOREIGN KEY (subscription_id) REFERENCES subscription_records(id) ON DELETE CASCADE,
  CONSTRAINT fk_subscription_renewal_logs_kit FOREIGN KEY (kit_id) REFERENCES kits(id),
  CONSTRAINT fk_subscription_renewal_logs_operator FOREIGN KEY (operated_by) REFERENCES users(id),

  INDEX idx_subscription_renewal_logs_subscription (subscription_id),
  INDEX idx_subscription_renewal_logs_kit (kit_id),
  INDEX idx_subscription_renewal_logs_operated_at (operated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订阅续费历史表';

CREATE TABLE IF NOT EXISTS subscription_push_logs (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  subscription_id INT NOT NULL COMMENT '订阅ID',
  kit_id INT NOT NULL COMMENT '套账ID',
  push_date DATE NOT NULL COMMENT '推送日期',
  push_type ENUM('reminder', 'overdue') NOT NULL COMMENT '推送类型：reminder-到期提醒，overdue-逾期提醒',
  days_until_expiry INT NULL COMMENT '距到期天数，逾期为负数',
  pushed_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '推送时间',

  CONSTRAINT fk_subscription_push_logs_subscription FOREIGN KEY (subscription_id) REFERENCES subscription_records(id) ON DELETE CASCADE,
  CONSTRAINT fk_subscription_push_logs_kit FOREIGN KEY (kit_id) REFERENCES kits(id),

  UNIQUE KEY uk_subscription_push_logs_subscription_date (subscription_id, push_date),
  INDEX idx_subscription_push_logs_kit_date (kit_id, push_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订阅提醒推送去重记录表';

INSERT INTO subscription_types (kit_id, name, code, is_default, sort_order, status, created_by)
SELECT 1, '企微认证', 'wecom_auth', TRUE, 10, 'active', 1
WHERE NOT EXISTS (SELECT 1 FROM subscription_types WHERE kit_id = 1 AND code = 'wecom_auth');

INSERT INTO subscription_types (kit_id, name, code, is_default, sort_order, status, created_by)
SELECT 1, '微信认证', 'wechat_auth', TRUE, 20, 'active', 1
WHERE NOT EXISTS (SELECT 1 FROM subscription_types WHERE kit_id = 1 AND code = 'wechat_auth');

INSERT INTO subscription_types (kit_id, name, code, is_default, sort_order, status, created_by)
SELECT 1, '公众号认证', 'official_account_auth', TRUE, 30, 'active', 1
WHERE NOT EXISTS (SELECT 1 FROM subscription_types WHERE kit_id = 1 AND code = 'official_account_auth');

INSERT INTO subscription_types (kit_id, name, code, is_default, sort_order, status, created_by)
SELECT 1, '云服务器', 'cloud_server', TRUE, 40, 'active', 1
WHERE NOT EXISTS (SELECT 1 FROM subscription_types WHERE kit_id = 1 AND code = 'cloud_server');

INSERT INTO subscription_types (kit_id, name, code, is_default, sort_order, status, created_by)
SELECT 1, 'SSL证书', 'ssl_cert', TRUE, 50, 'active', 1
WHERE NOT EXISTS (SELECT 1 FROM subscription_types WHERE kit_id = 1 AND code = 'ssl_cert');

INSERT INTO subscription_types (kit_id, name, code, is_default, sort_order, status, created_by)
SELECT 1, '软著相关', 'software_copyright', TRUE, 60, 'active', 1
WHERE NOT EXISTS (SELECT 1 FROM subscription_types WHERE kit_id = 1 AND code = 'software_copyright');

INSERT INTO subscription_types (kit_id, name, code, is_default, sort_order, status, created_by)
SELECT 1, '其他', 'other', TRUE, 70, 'active', 1
WHERE NOT EXISTS (SELECT 1 FROM subscription_types WHERE kit_id = 1 AND code = 'other');

-- 订阅续费附件表：记录每次续约对应的合同、发票附件
CREATE TABLE IF NOT EXISTS `subscription_renewal_attachments` (
  `attachment_id` int NOT NULL AUTO_INCREMENT,
  `renewal_log_id` int NOT NULL COMMENT '续费记录ID',
  `subscription_id` int NOT NULL COMMENT '订阅事项ID',
  `kit_id` int NOT NULL COMMENT '套账ID',
  `attachment_type` enum('contract','invoice') NOT NULL COMMENT '附件类型：合同/发票',
  `file_name` varchar(255) NOT NULL COMMENT '原始文件名',
  `file_path` varchar(255) NOT NULL COMMENT '文件路径',
  `file_type` varchar(50) DEFAULT NULL COMMENT '文件类型',
  `file_size` int DEFAULT NULL COMMENT '文件大小',
  `uploaded_by` int DEFAULT NULL COMMENT '上传人',
  `uploaded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
  PRIMARY KEY (`attachment_id`),
  KEY `idx_subscription_renewal_attachments_log` (`renewal_log_id`),
  KEY `idx_subscription_renewal_attachments_subscription` (`subscription_id`),
  KEY `idx_subscription_renewal_attachments_kit` (`kit_id`),
  KEY `idx_subscription_renewal_attachments_type` (`attachment_type`),
  CONSTRAINT `fk_subscription_renewal_attachments_log` FOREIGN KEY (`renewal_log_id`) REFERENCES `subscription_renewal_logs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_subscription_renewal_attachments_subscription` FOREIGN KEY (`subscription_id`) REFERENCES `subscription_records` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订阅续费附件表';
