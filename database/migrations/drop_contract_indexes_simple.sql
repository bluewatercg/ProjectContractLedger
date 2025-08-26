-- ================================================================
-- 合同提醒功能索引删除脚本 (简洁版)
-- 文件: drop_contract_indexes_simple.sql
-- 作者: System
-- 日期: 2025-08-26
-- ================================================================

-- 开始事务
START TRANSACTION;

-- 禁用警告信息
SET sql_notes = 0;

-- 删除可能存在的索引
DROP INDEX IF EXISTS idx_contracts_renewable ON contracts;
DROP INDEX IF EXISTS idx_contracts_renewable_status ON contracts;
DROP INDEX IF EXISTS idx_contracts_end_date_renewable ON contracts;
DROP INDEX IF EXISTS idx_contracts_start_date_status ON contracts;
DROP INDEX IF EXISTS idx_contracts_number ON contracts;
DROP INDEX IF EXISTS idx_contracts_customer_id ON contracts;

-- 重新启用警告信息
SET sql_notes = 1;

-- 提交事务
COMMIT;

-- ================================================================