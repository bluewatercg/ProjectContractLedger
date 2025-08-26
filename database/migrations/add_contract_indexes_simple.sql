-- ================================================================
-- 合同提醒功能索引优化脚本 (简化版)
-- 文件: add_contract_indexes_simple.sql
-- 作者: System  
-- 日期: 2025-08-26
-- 描述: 为合同提醒功能添加性能优化索引（简化版本）
-- ================================================================

-- 开始事务
START TRANSACTION;

-- 1. 为续签标识添加索引（如果已存在会报错但不影响执行）
-- DROP INDEX IF EXISTS idx_contracts_renewable ON contracts;
CREATE INDEX idx_contracts_renewable ON contracts (is_renewable);

-- 2. 为续签合同状态查询添加复合索引
-- DROP INDEX IF EXISTS idx_contracts_renewable_status ON contracts;
CREATE INDEX idx_contracts_renewable_status ON contracts (is_renewable, status);

-- 3. 为提醒查询优化的复合索引（按到期日期、续签标识、状态）
-- DROP INDEX IF EXISTS idx_contracts_end_date_renewable ON contracts;
CREATE INDEX idx_contracts_end_date_renewable ON contracts (end_date, is_renewable, status);

-- 4. 为履约提醒查询优化的复合索引（按开始日期、状态）
-- DROP INDEX IF EXISTS idx_contracts_start_date_status ON contracts;
CREATE INDEX idx_contracts_start_date_status ON contracts (start_date, status);

-- 5. 为合同号查询添加索引
-- DROP INDEX IF EXISTS idx_contracts_number ON contracts;
CREATE INDEX idx_contracts_number ON contracts (contract_number);

-- 6. 为客户ID查询添加索引
-- DROP INDEX IF EXISTS idx_contracts_customer_id ON contracts;
CREATE INDEX idx_contracts_customer_id ON contracts (customer_id);

-- 验证索引创建结果
SELECT 
    TABLE_NAME as '表名',
    INDEX_NAME as '索引名', 
    COLUMN_NAME as '字段名',
    SEQ_IN_INDEX as '字段序号'
FROM information_schema.statistics 
WHERE table_schema = DATABASE() 
AND table_name = 'contracts'
AND index_name LIKE 'idx_contracts_%'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- 提交事务
COMMIT;

-- ================================================================
-- 使用说明：
-- 
-- 1. 如果索引已存在，CREATE INDEX会报错，但可以忽略
-- 2. 可以先手动删除现有索引再运行此脚本
-- 3. 这些索引将提升提醒查询的性能
-- 
-- 手动删除索引的命令（如需要）：
-- DROP INDEX idx_contracts_renewable ON contracts;
-- DROP INDEX idx_contracts_renewable_status ON contracts; 
-- DROP INDEX idx_contracts_end_date_renewable ON contracts;
-- DROP INDEX idx_contracts_start_date_status ON contracts;
-- DROP INDEX idx_contracts_number ON contracts;
-- DROP INDEX idx_contracts_customer_id ON contracts;
-- ================================================================