-- Migration: add_subscription_reminder_mode
-- Date: 2026-07-09
-- Description: Add reminder mode for subscription reminders

DELIMITER //

DROP PROCEDURE IF EXISTS migrate_subscription_reminder_mode //

CREATE PROCEDURE migrate_subscription_reminder_mode()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'subscription_records'
      AND COLUMN_NAME = 'reminder_mode'
  ) THEN
    ALTER TABLE subscription_records
      ADD COLUMN reminder_mode ENUM('once', 'daily') NOT NULL DEFAULT 'daily' COMMENT '提醒方式：once-仅提醒一次，daily-到期前每日提醒' AFTER remind_days_before;
  END IF;
END //

DELIMITER ;

CALL migrate_subscription_reminder_mode();

DROP PROCEDURE IF EXISTS migrate_subscription_reminder_mode;
