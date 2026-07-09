-- Migration: alter_subscription_owner_names
-- Date: 2026-07-07
-- Description: Allow subscription owners to be free-text names instead of system users

DELIMITER //

DROP PROCEDURE IF EXISTS migrate_subscription_owner_names //

CREATE PROCEDURE migrate_subscription_owner_names()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'subscription_records'
      AND COLUMN_NAME = 'owner_name'
  ) THEN
    ALTER TABLE subscription_records
      ADD COLUMN owner_name VARCHAR(100) NULL COMMENT '主负责人名称（非系统用户）' AFTER remind_days_before;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'subscription_records'
      AND COLUMN_NAME = 'cc_names'
  ) THEN
    ALTER TABLE subscription_records
      ADD COLUMN cc_names VARCHAR(500) NULL COMMENT '其他负责人名称，手工输入' AFTER cc_user_ids;
  END IF;

  ALTER TABLE subscription_records
    MODIFY COLUMN owner_user_id INT NULL COMMENT '历史主负责人用户ID，可为空';

  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'subscription_records'
      AND INDEX_NAME = 'idx_subscription_records_owner_name'
  ) THEN
    ALTER TABLE subscription_records
      ADD INDEX idx_subscription_records_owner_name (kit_id, owner_name);
  END IF;
END //

DELIMITER ;

CALL migrate_subscription_owner_names();

DROP PROCEDURE IF EXISTS migrate_subscription_owner_names;
