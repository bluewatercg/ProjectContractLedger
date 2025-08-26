-- ================================================================
-- 合同提醒功能索引删除脚本
-- 文件: drop_contract_indexes.sql
-- 作者: System
-- 日期: 2025-08-26
-- 描述: 删除合同提醒功能相关的所有索引
-- ================================================================

-- 开始事务
START TRANSACTION;

-- 禁用警告信息
SET sql_notes = 0;

SELECT '🗑️ 开始删除合同提醒功能相关索引...' as status;

-- 删除可能存在的索引
DROP INDEX IF EXISTS idx_contracts_renewable ON contracts;
SELECT '✅ 删除索引 idx_contracts_renewable' as result;

DROP INDEX IF EXISTS idx_contracts_renewable_status ON contracts;
SELECT '✅ 删除索引 idx_contracts_renewable_status' as result;

DROP INDEX IF EXISTS idx_contracts_end_date_renewable ON contracts;
SELECT '✅ 删除索引 idx_contracts_end_date_renewable' as result;

DROP INDEX IF EXISTS idx_contracts_start_date_status ON contracts;
SELECT '✅ 删除索引 idx_contracts_start_date_status' as result;

DROP INDEX IF EXISTS idx_contracts_number ON contracts;
SELECT '✅ 删除索引 idx_contracts_number' as result;

DROP INDEX IF EXISTS idx_contracts_customer_id ON contracts;
SELECT '✅ 删除索引 idx_contracts_customer_id' as result;

-- 重新启用警告信息
SET sql_notes = 1;

-- 验证删除结果
SELECT 
    '📊 索引删除验证报告' as '报告类型',
    '' as '详细信息';

-- 检查剩余的索引
SELECT 
    TABLE_NAME as '表名',
    INDEX_NAME as '索引名',
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as '索引字段',
    COUNT(*) as '字段数量'
FROM information_schema.statistics 
WHERE table_schema = DATABASE() 
AND table_name = 'contracts'
AND index_name LIKE 'idx_contracts_%'
GROUP BY TABLE_NAME, INDEX_NAME
ORDER BY INDEX_NAME;

-- 显示删除统计
SELECT 
    CASE 
        WHEN COUNT(DISTINCT INDEX_NAME) = 0 THEN '✅ 所有相关索引已删除'
        ELSE CONCAT('⚠️ 还有 ', COUNT(DISTINCT INDEX_NAME), ' 个相关索引未删除')
    END as '删除状态'
FROM information_schema.statistics 
WHERE table_schema = DATABASE() 
AND table_name = 'contracts'
AND index_name LIKE 'idx_contracts_%';

-- 提交事务
COMMIT;

SELECT '🧹 合同提醒功能索引删除完成！' as final_status;

-- ================================================================
-- 使用说明：
-- 
-- 此脚本会删除以下索引：
-- 1. idx_contracts_renewable - 续签标识索引
-- 2. idx_contracts_renewable_status - 续签状态复合索引
-- 3. idx_contracts_end_date_renewable - 到期时间复合索引
-- 4. idx_contracts_start_date_status - 开始时间状态索引
-- 5. idx_contracts_number - 合同号索引
-- 6. idx_contracts_customer_id - 客户ID索引
--
-- 注意：
-- - 使用 IF EXISTS 确保即使索引不存在也不会报错
-- - 删除索引不会影响数据，但会影响查询性能
-- - 如需重新创建索引，请使用 add_contract_indexes_safe.sql
-- ================================================================