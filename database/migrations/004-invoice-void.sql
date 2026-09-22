-- Migration: 004-invoice-void
-- Date: 2026-09-22
-- Description: 保留发票台账作废原因、操作人及时间；历史 cancelled 记录不伪造审计信息。
-- Rollback: ALTER TABLE invoices DROP COLUMN void_reason, DROP COLUMN voided_by, DROP COLUMN voided_at;
ALTER TABLE invoices
  ADD COLUMN void_reason VARCHAR(500) NULL COMMENT '台账作废原因',
  ADD COLUMN voided_by INT NULL COMMENT '台账作废操作人ID',
  ADD COLUMN voided_at DATETIME NULL COMMENT '台账作废时间';
