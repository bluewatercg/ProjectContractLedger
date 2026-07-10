-- Migration: add_subscription_next_reminder_start_date
-- Date: 2026-07-07
-- Description: Add editable next reminder start date for subscription records

DELIMITER $$

CREATE PROCEDURE add_subscription_next_reminder_start_date_if_missing()
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'subscription_records'
      AND COLUMN_NAME = 'next_reminder_start_date'
  ) THEN
    ALTER TABLE subscription_records
      ADD COLUMN next_reminder_start_date DATE NULL COMMENT '下次提醒开始日' AFTER current_expiry_date;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'subscription_records'
      AND INDEX_NAME = 'idx_subscription_records_reminder_start'
  ) THEN
    ALTER TABLE subscription_records
      ADD INDEX idx_subscription_records_reminder_start (kit_id, next_reminder_start_date);
  END IF;
END$$

DELIMITER ;

CALL add_subscription_next_reminder_start_date_if_missing();
DROP PROCEDURE add_subscription_next_reminder_start_date_if_missing;

UPDATE subscription_records
SET next_reminder_start_date = DATE_SUB(current_expiry_date, INTERVAL remind_days_before DAY)
WHERE next_reminder_start_date IS NULL;
