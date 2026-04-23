-- 业务分类合同集成迁移
-- Step 1: 创建 business_categories 表（如果不存在）
-- Step 2: 为 contracts 表新增 business_category_id 字段

CREATE TABLE IF NOT EXISTS `business_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  `kit_id` INT NOT NULL COMMENT '套账ID',
  `parent_id` INT NULL COMMENT '父分类ID，NULL表示根节点',
  `name` VARCHAR(100) NOT NULL COMMENT '分类名称',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '同级排序序号',
  `status` ENUM('active', 'disabled') NOT NULL DEFAULT 'active' COMMENT '状态：active-启用，disabled-禁用',
  `created_by` INT NOT NULL COMMENT '创建人ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  KEY `idx_kit_id` (`kit_id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `FK_business_category_kit` FOREIGN KEY (`kit_id`) REFERENCES `kits`(`id`),
  CONSTRAINT `FK_business_category_parent` FOREIGN KEY (`parent_id`) REFERENCES `business_categories`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='业务分类表';

-- Step 2: contracts 表新增 business_category_id
ALTER TABLE `contracts`
  ADD COLUMN `business_category_id` INT NULL COMMENT '业务分类ID';

-- 添加外键约束（先检查是否已存在）
ALTER TABLE `contracts`
  ADD CONSTRAINT `FK_contract_business_category`
  FOREIGN KEY (`business_category_id`) REFERENCES `business_categories`(`id`) ON DELETE SET NULL;
