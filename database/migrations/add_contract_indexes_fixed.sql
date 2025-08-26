-- ================================================================
-- 合同提醒功能索引优化脚本 (MySQL版本)
-- 文件: add_contract_indexes_fixed.sql
-- 作者: System
-- 日期: 2025-08-26
-- 描述: 为合同提醒功能添加性能优化索引
-- ================================================================

-- 开始事务
START TRANSACTION;

-- 检查并创建索引的存储过程
DELIMITER $$

-- 创建索引的安全函数
CREATE PROCEDURE CreateIndexIfNotExists(
    IN indexName VARCHAR(64),
    IN tableName VARCHAR(64), 
    IN indexColumns TEXT
)
BEGIN
    DECLARE indexExists INT DEFAULT 0;
    
    -- 检查索引是否存在
    SELECT COUNT(1) INTO indexExists
    FROM information_schema.statistics 
    WHERE table_schema = DATABASE() 
    AND table_name = tableName 
    AND index_name = indexName;
    
    -- 如果索引不存在则创建
    IF indexExists = 0 THEN
        SET @sql = CONCAT('CREATE INDEX ', indexName, ' ON ', tableName, ' (', indexColumns, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        SELECT CONCAT('✅ 索引 ', indexName, ' 创建成功') AS result;
    ELSE
        SELECT CONCAT('ℹ️ 索引 ', indexName, ' 已存在，跳过创建') AS result;
    END IF;
END$$

DELIMITER ;

-- 1. 为续签标识添加索引（用于筛选续签合同）
CALL CreateIndexIfNotExists('idx_contracts_renewable', 'contracts', 'is_renewable');

-- 2. 为续签合同状态查询添加复合索引（用于活跃续签合同筛选）
CALL CreateIndexIfNotExists('idx_contracts_renewable_status', 'contracts', 'is_renewable, status');

-- 3. 为提醒查询优化的复合索引（按到期日期、续签标识、状态）
-- 这个索引特别针对即将到期的续签合同查询进行优化
CALL CreateIndexIfNotExists('idx_contracts_end_date_renewable', 'contracts', 'end_date, is_renewable, status');

-- 4. 为履约提醒查询优化的复合索引（按开始日期、状态）
-- 这个索引用于查找已生效但未开票的合同
CALL CreateIndexIfNotExists('idx_contracts_start_date_status', 'contracts', 'start_date, status');

-- 5. 为合同号查询添加索引（提高合同查找性能）
CALL CreateIndexIfNotExists('idx_contracts_number', 'contracts', 'contract_number');

-- 6. 为客户ID查询添加索引（提高客户相关查询性能）
CALL CreateIndexIfNotExists('idx_contracts_customer_id', 'contracts', 'customer_id');

-- 清理存储过程
DROP PROCEDURE CreateIndexIfNotExists;

-- 验证索引创建结果
SELECT 
    TABLE_NAME as '表名',
    INDEX_NAME as '索引名',
    COLUMN_NAME as '字段名',
    SEQ_IN_INDEX as '字段序号',
    NON_UNIQUE as '非唯一索引'
FROM information_schema.statistics 
WHERE table_schema = DATABASE() 
AND table_name = 'contracts'
AND index_name LIKE 'idx_contracts_%'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- 显示索引使用统计
SELECT 
    '索引优化完成' as '状态',
    COUNT(*) as '新增索引数量'
FROM information_schema.statistics 
WHERE table_schema = DATABASE() 
AND table_name = 'contracts'
AND index_name LIKE 'idx_contracts_%';

-- 提交事务
COMMIT;

-- ================================================================
-- 索引说明：
-- 
-- 1. idx_contracts_renewable: 用于快速筛选续签合同
-- 2. idx_contracts_renewable_status: 用于筛选活跃的续签合同
-- 3. idx_contracts_end_date_renewable: 用于提醒查询，按到期时间筛选续签合同
-- 4. idx_contracts_start_date_status: 用于开票提醒，查找已生效的合同
-- 5. idx_contracts_number: 用于合同号快速查询
-- 6. idx_contracts_customer_id: 用于客户相关查询优化
--
-- 这些索引将显著提升以下查询的性能：
-- - 续签提醒查询
-- - 履约完成提醒查询  
-- - 开票需求提醒查询
-- - 合同状态统计查询
-- - 客户合同列表查询
-- ================================================================