-- 合同生命周期异常管理迁移
-- Phase 1: 合同不续签管理
-- Phase 2: 坏账标记与联动
-- Enterprise: 企业活跃度自动同步

-- ============================================
-- Phase 1: contracts 表新增字段
-- ============================================

-- 新增不续签相关字段
ALTER TABLE `contracts`
  ADD COLUMN IF NOT EXISTS `non_renewal_reason` TEXT NULL COMMENT '不续签原因',
  ADD COLUMN IF NOT EXISTS `non_renewal_decided_by` INT NULL COMMENT '不续签决策人',
  ADD COLUMN IF NOT EXISTS `non_renewal_decided_at` DATETIME NULL COMMENT '不续签决策时间',
  ADD COLUMN IF NOT EXISTS `previous_contract_id` INT NULL COMMENT '关联的旧合同ID（续签新合同）',
  ADD COLUMN IF NOT EXISTS `renewal_confirmed_at` DATETIME NULL COMMENT '续签确认时间';

-- 新增外键约束
ALTER TABLE `contracts`
  ADD CONSTRAINT IF NOT EXISTS `FK_contract_previous_contract`
  FOREIGN KEY (`previous_contract_id`) REFERENCES `contracts`(`id`) ON DELETE SET NULL;

-- 更新 status enum 值（添加 expired_non_renewed）
ALTER TABLE `contracts`
  MODIFY COLUMN `status` ENUM('draft', 'active', 'completed', 'cancelled', 'expired_non_renewed') DEFAULT 'draft';

-- ============================================
-- Phase 2: invoices 表新增坏账字段
-- ============================================

ALTER TABLE `invoices`
  ADD COLUMN IF NOT EXISTS `bad_debt_amount` DECIMAL(15,2) DEFAULT 0 COMMENT '坏账金额',
  ADD COLUMN IF NOT EXISTS `bad_debt_reason` TEXT NULL COMMENT '坏账原因',
  ADD COLUMN IF NOT EXISTS `bad_debt_handler` INT NULL COMMENT '坏账处理人',
  ADD COLUMN IF NOT EXISTS `bad_debt_marked_at` DATETIME NULL COMMENT '坏账标记时间';

-- 更新 status enum 值（添加 bad_debt）
ALTER TABLE `invoices`
  MODIFY COLUMN `status` ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled', 'bad_debt') DEFAULT 'sent';

-- ============================================
-- Phase 2: contract_invoice_plan 表新增 bad_debt 状态
-- ============================================

ALTER TABLE `contract_invoice_plan`
  MODIFY COLUMN `status` ENUM('pending', 'partial_invoiced', 'invoiced', 'cancelled', 'bad_debt') DEFAULT 'pending';
