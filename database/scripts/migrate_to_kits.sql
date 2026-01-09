-- ================================================
-- 套装(Kit)功能 - 完整数据库迁移脚本
-- 适用于: procontractledger 数据库
-- 版本: 1.0 (2026-01-09)
-- ================================================

USE procontractledger;

-- ================================================
-- 第一部分：创建套装相关的表
-- ================================================

-- 1.1 创建 kits 表（套装表）
CREATE TABLE IF NOT EXISTS `kits` (
    `id` INT NOT NULL AUTO_INCREMENT COMMENT '套装ID',
    `name` VARCHAR(100) NOT NULL COMMENT '套装名称',
    `code` VARCHAR(50) NOT NULL COMMENT '套装编码',
    `description` TEXT NULL COMMENT '套装描述',
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active' COMMENT '状态',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE INDEX `uk_code`(`code` ASC) USING BTREE,
    INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '套装表' ROW_FORMAT = DYNAMIC;

-- 1.2 创建 user_kits 表（用户-套装授权关系表）
CREATE TABLE IF NOT EXISTS `user_kits` (
    `id` INT NOT NULL AUTO_INCREMENT COMMENT '关系ID',
    `user_id` INT NOT NULL COMMENT '用户ID',
    `kit_id` INT NOT NULL COMMENT '套装ID',
    `is_default` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否为用户默认套装',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE INDEX `uk_user_kit`(`user_id` ASC, `kit_id` ASC) USING BTREE,
    INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
    INDEX `idx_kit_id`(`kit_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户套装授权表' ROW_FORMAT = DYNAMIC;

-- ================================================
-- 第二部分：插入默认套装
-- ================================================

INSERT INTO `kits` (`name`, `code`, `description`, `status`) 
VALUES ('默认套装', 'default', '系统默认套装，包含所有历史数据', 'active')
ON DUPLICATE KEY UPDATE `name` = `name`;

-- ================================================
-- 第三部分：为业务表添加 kit_id 列（如果列已存在则跳过）
-- ================================================

-- 使用存储过程安全添加列
DELIMITER //

DROP PROCEDURE IF EXISTS add_kit_id_columns //

CREATE PROCEDURE add_kit_id_columns()
BEGIN
    -- customers 表
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'customers' 
                   AND COLUMN_NAME = 'kit_id') THEN
        ALTER TABLE `customers` ADD COLUMN `kit_id` INT NOT NULL DEFAULT 1 COMMENT '所属套装ID' AFTER `id`;
        ALTER TABLE `customers` ADD INDEX `idx_customers_kit_id`(`kit_id` ASC);
    END IF;
    
    -- contracts 表
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'contracts' 
                   AND COLUMN_NAME = 'kit_id') THEN
        ALTER TABLE `contracts` ADD COLUMN `kit_id` INT NOT NULL DEFAULT 1 COMMENT '所属套装ID' AFTER `id`;
        ALTER TABLE `contracts` ADD INDEX `idx_contracts_kit_id`(`kit_id` ASC);
    END IF;
    
    -- invoices 表
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'invoices' 
                   AND COLUMN_NAME = 'kit_id') THEN
        ALTER TABLE `invoices` ADD COLUMN `kit_id` INT NOT NULL DEFAULT 1 COMMENT '所属套装ID' AFTER `id`;
        ALTER TABLE `invoices` ADD INDEX `idx_invoices_kit_id`(`kit_id` ASC);
    END IF;
    
    -- payments 表
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'payments' 
                   AND COLUMN_NAME = 'kit_id') THEN
        ALTER TABLE `payments` ADD COLUMN `kit_id` INT NOT NULL DEFAULT 1 COMMENT '所属套装ID' AFTER `id`;
        ALTER TABLE `payments` ADD INDEX `idx_payments_kit_id`(`kit_id` ASC);
    END IF;
END //

DELIMITER ;

-- 执行存储过程
CALL add_kit_id_columns();

-- 删除存储过程
DROP PROCEDURE IF EXISTS add_kit_id_columns;

-- ================================================
-- 第四部分：迁移现有数据到默认套装
-- ================================================

SET @default_kit_id = (SELECT `id` FROM `kits` WHERE `code` = 'default');

UPDATE `customers` SET `kit_id` = @default_kit_id WHERE `kit_id` = 0 OR `kit_id` IS NULL;
UPDATE `contracts` SET `kit_id` = @default_kit_id WHERE `kit_id` = 0 OR `kit_id` IS NULL;
UPDATE `invoices` SET `kit_id` = @default_kit_id WHERE `kit_id` = 0 OR `kit_id` IS NULL;
UPDATE `payments` SET `kit_id` = @default_kit_id WHERE `kit_id` = 0 OR `kit_id` IS NULL;

-- ================================================
-- 第五部分：授权所有现有用户访问默认套装
-- ================================================

INSERT INTO `user_kits` (`user_id`, `kit_id`, `is_default`)
SELECT `id`, @default_kit_id, 1 FROM `users`
ON DUPLICATE KEY UPDATE `is_default` = 1;

-- ================================================
-- 第六部分：清理重复的 user_kits 记录
-- ================================================

DELETE uk1 FROM user_kits uk1
INNER JOIN user_kits uk2
WHERE uk1.user_id = uk2.user_id
  AND uk1.kit_id = uk2.kit_id
  AND uk1.id > uk2.id;

-- ================================================
-- 第七部分：验证迁移结果
-- ================================================

SELECT '========== 迁移结果 ==========' AS info;

SELECT 
    '套装数量' AS item,
    COUNT(*) AS count
FROM `kits`
UNION ALL
SELECT 
    '用户套装授权数' AS item,
    COUNT(*) AS count
FROM `user_kits`
UNION ALL
SELECT 
    CONCAT('客户(kit_id=', @default_kit_id, ')') AS item,
    COUNT(*) AS count
FROM `customers` WHERE `kit_id` = @default_kit_id
UNION ALL
SELECT 
    CONCAT('合同(kit_id=', @default_kit_id, ')') AS item,
    COUNT(*) AS count
FROM `contracts` WHERE `kit_id` = @default_kit_id;

SELECT '========== 迁移完成 ==========' AS info;
