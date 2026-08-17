-- Migration: add_subscription_start_date
-- Date: 2026-08-16
-- Description: Add nullable subscription start date without backfilling legacy records

DELIMITER $$

CREATE PROCEDURE add_subscription_start_date_if_missing()
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'subscription_records'
      AND COLUMN_NAME = 'start_date'
  ) THEN
    ALTER TABLE subscription_records
      ADD COLUMN start_date DATE NULL COMMENT '订阅起始日期' AFTER renewal_url;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'subscription_records'
      AND INDEX_NAME = 'idx_subscription_records_start_date'
  ) THEN
    ALTER TABLE subscription_records
      ADD INDEX idx_subscription_records_start_date (kit_id, start_date);
  END IF;
END$$

DELIMITER ;

CALL add_subscription_start_date_if_missing();
DROP PROCEDURE add_subscription_start_date_if_missing;
