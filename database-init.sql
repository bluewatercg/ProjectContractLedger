-- 客户合同管理系统数据库初始化脚本
-- 数据库: procontractledger

USE procontractledger;

-- 创建用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL UNIQUE,
  `email` varchar(100) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(50) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('admin','user') NOT NULL DEFAULT 'user',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建客户表
CREATE TABLE IF NOT EXISTS `customers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `contact_person` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `tax_number` varchar(50) DEFAULT NULL,
  `bank_account` varchar(100) DEFAULT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建合同表
CREATE TABLE IF NOT EXISTS `contracts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `contract_number` varchar(50) NOT NULL UNIQUE,
  `customer_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('draft','active','completed','cancelled') NOT NULL DEFAULT 'draft',
  `terms` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_contract_number` (`contract_number`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_contracts_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建发票表
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_number` varchar(50) NOT NULL UNIQUE,
  `contract_id` int(11) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `tax_rate` decimal(5,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(15,2) NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `issue_date` date NOT NULL,
  `due_date` date NOT NULL,
  `status` enum('draft','sent','paid','overdue','cancelled') NOT NULL DEFAULT 'draft',
  `description` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_contract_id` (`contract_id`),
  KEY `idx_invoice_number` (`invoice_number`),
  KEY `idx_status` (`status`),
  KEY `idx_due_date` (`due_date`),
  CONSTRAINT `fk_invoices_contract` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建支付表
CREATE TABLE IF NOT EXISTS `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_id` int(11) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_date` date NOT NULL,
  `payment_method` enum('cash','bank_transfer','check','credit_card','other') NOT NULL DEFAULT 'bank_transfer',
  `reference_number` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('pending','completed','failed') NOT NULL DEFAULT 'completed',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_invoice_id` (`invoice_id`),
  KEY `idx_payment_date` (`payment_date`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_payments_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入默认管理员用户 (密码: admin123)
INSERT IGNORE INTO `users` (`username`, `email`, `password`, `full_name`, `role`, `status`) VALUES
('admin', 'admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '系统管理员', 'admin', 'active');

-- 插入示例客户数据
INSERT IGNORE INTO `customers` (`name`, `contact_person`, `phone`, `email`, `address`, `status`) VALUES
('北京科技有限公司', '张三', '13800138001', 'zhangsan@bjtech.com', '北京市朝阳区科技园区1号', 'active'),
('上海贸易公司', '李四', '13800138002', 'lisi@shtrade.com', '上海市浦东新区贸易大厦2楼', 'active'),
('广州制造企业', '王五', '13800138003', 'wangwu@gzmanuf.com', '广州市天河区制造业园区3号', 'active');

-- 插入示例合同数据
INSERT IGNORE INTO `contracts` (`contract_number`, `customer_id`, `title`, `description`, `total_amount`, `start_date`, `end_date`, `status`) VALUES
('CT202401001', 1, '软件开发服务合同', '为客户开发定制化管理系统', 100000.00, '2024-01-01', '2024-06-30', 'active'),
('CT202401002', 2, '设备采购合同', '采购办公设备及安装服务', 50000.00, '2024-01-15', '2024-03-15', 'active'),
('CT202401003', 3, '技术咨询服务合同', '提供技术咨询和培训服务', 30000.00, '2024-02-01', '2024-05-01', 'draft');

-- 插入示例发票数据
INSERT IGNORE INTO `invoices` (`invoice_number`, `contract_id`, `amount`, `tax_rate`, `tax_amount`, `total_amount`, `issue_date`, `due_date`, `status`) VALUES
('INV202401001', 1, 50000.00, 6.00, 3000.00, 53000.00, '2024-01-01', '2024-01-31', 'paid'),
('INV202401002', 2, 25000.00, 6.00, 1500.00, 26500.00, '2024-01-15', '2024-02-14', 'sent'),
('INV202401003', 1, 50000.00, 6.00, 3000.00, 53000.00, '2024-03-01', '2024-03-31', 'draft');

-- 插入示例支付数据
INSERT IGNORE INTO `payments` (`invoice_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `status`) VALUES
(1, 53000.00, '2024-01-25', 'bank_transfer', 'TXN20240125001', 'completed'),
(2, 26500.00, '2024-02-10', 'bank_transfer', 'TXN20240210001', 'completed');

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS `idx_customers_name` ON `customers` (`name`);
CREATE INDEX IF NOT EXISTS `idx_customers_status` ON `customers` (`status`);
CREATE INDEX IF NOT EXISTS `idx_contracts_dates` ON `contracts` (`start_date`, `end_date`);
CREATE INDEX IF NOT EXISTS `idx_invoices_dates` ON `invoices` (`issue_date`, `due_date`);
CREATE INDEX IF NOT EXISTS `idx_payments_method` ON `payments` (`payment_method`);

-- 显示表结构信息
SHOW TABLES;

SELECT 'Database initialization completed successfully!' as message;
