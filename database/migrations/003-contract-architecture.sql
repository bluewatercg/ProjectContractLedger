-- Migration: 003-contract-architecture
-- Date: 2026-09-21
-- Description: Phase 1 合同架构改造
--   1) contracts 新增 contract_type 字段（main/maintenance/renewal/supplement/standalone）
--   2) 新建 contract_relations 表，表达合同间关联关系
--   3) payments 新增 payer_customer_id（甲签乙付场景）
--   4) 新建 invoice_payment_allocations 表（发票级付款承担方分摊）
--
-- Rollback:
--   DROP TABLE IF EXISTS invoice_payment_allocations;
--   DROP TABLE IF EXISTS contract_relations;
--   ALTER TABLE payments DROP COLUMN payer_customer_id;
--   ALTER TABLE contracts DROP COLUMN contract_type;

-- ============================================================
-- 1) contracts.contract_type
-- ============================================================
ALTER TABLE contracts
ADD COLUMN contract_type ENUM('main','maintenance','renewal','supplement','standalone')
  NOT NULL DEFAULT 'standalone'
  COMMENT '合同类型：main-主合同, maintenance-运维合同, renewal-续签合同, supplement-补充协议, standalone-独立合同'
  AFTER business_category_id;

CREATE INDEX idx_contracts_kit_type ON contracts(kit_id, contract_type);

-- ============================================================
-- 2) contract_relations — 合同关联关系表
-- ============================================================
CREATE TABLE IF NOT EXISTS contract_relations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kit_id INT NOT NULL COMMENT '套账ID',
  source_contract_id INT NOT NULL COMMENT '源合同ID（如主合同）',
  target_contract_id INT NOT NULL COMMENT '目标合同ID（如运维合同）',
  relation_type ENUM('main_operation','main_supplement','renewal','replacement','related')
    NOT NULL
    COMMENT '关系类型：main_operation-主合同-运维合同, main_supplement-主合同-补充协议, renewal-续签, replacement-替代, related-关联',
  remarks TEXT COMMENT '备注',
  created_by INT NOT NULL COMMENT '创建人ID',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_contract_relations_kit FOREIGN KEY (kit_id) REFERENCES kits(id) ON DELETE CASCADE,
  CONSTRAINT fk_contract_relations_source FOREIGN KEY (source_contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
  CONSTRAINT fk_contract_relations_target FOREIGN KEY (target_contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
  CONSTRAINT fk_contract_relations_creator FOREIGN KEY (created_by) REFERENCES users(id),

  -- 同一套账下，同类型关系不允许重复
  CONSTRAINT uq_contract_relation UNIQUE (kit_id, source_contract_id, target_contract_id, relation_type),

  INDEX idx_contract_relations_source (kit_id, source_contract_id),
  INDEX idx_contract_relations_target (kit_id, target_contract_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='合同关联关系表';

-- ============================================================
-- 3) payments.payer_customer_id
-- ============================================================
-- entity 已声明该字段，此处补齐 DDL
ALTER TABLE payments
ADD COLUMN payer_customer_id INT NULL
  COMMENT '实际付款客户ID（甲签乙付场景，为空时取 invoice→contract.customer_id）'
  AFTER notes;

CREATE INDEX idx_payments_payer ON payments(kit_id, payer_customer_id);

ALTER TABLE payments
ADD CONSTRAINT fk_payments_payer_customer
  FOREIGN KEY (payer_customer_id) REFERENCES customers(id) ON DELETE SET NULL;

-- ============================================================
-- 4) invoice_payment_allocations — 发票级付款承担方分摊表
-- ============================================================
CREATE TABLE IF NOT EXISTS invoice_payment_allocations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kit_id INT NOT NULL COMMENT '套账ID',
  invoice_id INT NOT NULL COMMENT '发票ID',
  payer_customer_id INT NOT NULL COMMENT '承担付款的客户ID',
  allocated_amount DECIMAL(15,2) NOT NULL COMMENT '分摊金额',
  allocated_ratio DECIMAL(5,2) NOT NULL COMMENT '分摊比例（百分比，如 50.00 表示 50%）',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_ipa_kit FOREIGN KEY (kit_id) REFERENCES kits(id) ON DELETE CASCADE,
  CONSTRAINT fk_ipa_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  CONSTRAINT fk_ipa_payer FOREIGN KEY (payer_customer_id) REFERENCES customers(id) ON DELETE CASCADE,

  -- 同一发票同一承担方只记录一次
  CONSTRAINT uq_ipa_invoice_payer UNIQUE (invoice_id, payer_customer_id),

  INDEX idx_ipa_invoice (invoice_id),
  INDEX idx_ipa_payer (payer_customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='发票级付款承担方分摊表（一张发票由多个客户分摊付款）';
