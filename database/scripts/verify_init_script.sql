-- ================================================================
-- 数据库初始化脚本验证工具
-- 文件: verify_init_script.sql
-- 作者: System
-- 日期: 2025-08-26
-- 描述: 验证 mysql_init.sql 脚本是否包含所有必要字段和索引
-- ================================================================

-- 验证合同表字段完整性
SELECT 
    '=== 合同表字段验证 ===' as '验证项目',
    '' as '详细信息';

SELECT 
    COLUMN_NAME as '字段名',
    DATA_TYPE as '数据类型',
    IS_NULLABLE as '可为空',
    COLUMN_DEFAULT as '默认值',
    COLUMN_COMMENT as '字段说明'
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'contracts'
ORDER BY ORDINAL_POSITION;

-- 验证新增的续签相关字段
SELECT 
    '=== 续签功能字段检查 ===' as '验证项目',
    '' as '详细信息';

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'contracts' 
              AND COLUMN_NAME = 'is_renewable'
              AND DATA_TYPE = 'tinyint'
        ) THEN '✅ is_renewable 字段存在且类型正确'
        ELSE '❌ is_renewable 字段缺失或类型错误'
    END as 'is_renewable字段检查';

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'contracts' 
              AND COLUMN_NAME = 'renewal_reminder_days'
              AND DATA_TYPE = 'enum'
        ) THEN '✅ renewal_reminder_days 字段存在且类型正确'
        ELSE '❌ renewal_reminder_days 字段缺失或类型错误'
    END as 'renewal_reminder_days字段检查';

-- 验证索引完整性
SELECT 
    '=== 合同表索引验证 ===' as '验证项目',
    '' as '详细信息';

SELECT 
    INDEX_NAME as '索引名',
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as '索引字段',
    NON_UNIQUE as '非唯一索引',
    INDEX_TYPE as '索引类型'
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'contracts'
GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE
ORDER BY INDEX_NAME;

-- 验证续签功能相关的索引
SELECT 
    '=== 续签功能索引检查 ===' as '验证项目',
    '' as '详细信息';

-- 检查必需的索引
SELECT 
    'idx_contracts_renewable' as '索引名',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS 
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'contracts' 
              AND INDEX_NAME = 'idx_contracts_renewable'
        ) THEN '✅ 存在'
        ELSE '❌ 缺失'
    END as '状态';

SELECT 
    'idx_contracts_renewable_status' as '索引名',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS 
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'contracts' 
              AND INDEX_NAME = 'idx_contracts_renewable_status'
        ) THEN '✅ 存在'
        ELSE '❌ 缺失'
    END as '状态';

SELECT 
    'idx_contracts_end_date_renewable' as '索引名',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS 
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'contracts' 
              AND INDEX_NAME = 'idx_contracts_end_date_renewable'
        ) THEN '✅ 存在'
        ELSE '❌ 缺失'
    END as '状态';

SELECT 
    'idx_contracts_start_date_status' as '索引名',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS 
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'contracts' 
              AND INDEX_NAME = 'idx_contracts_start_date_status'
        ) THEN '✅ 存在'
        ELSE '❌ 缺失'
    END as '状态';

-- 验证表结构完整性
SELECT 
    '=== 数据库表结构完整性验证 ===' as '验证项目',
    '' as '详细信息';

SELECT 
    TABLE_NAME as '表名',
    TABLE_COMMENT as '表说明',
    ENGINE as '存储引擎',
    TABLE_COLLATION as '字符集'
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;

-- 统计报告
SELECT 
    '=== 验证总结报告 ===' as '验证项目',
    '' as '详细信息';

SELECT 
    '数据库表总数' as '项目',
    COUNT(*) as '数量'
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_TYPE = 'BASE TABLE';

SELECT 
    '合同表字段总数' as '项目',
    COUNT(*) as '数量'
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'contracts';

SELECT 
    '合同表索引总数' as '项目',
    COUNT(DISTINCT INDEX_NAME) as '数量'
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'contracts';

SELECT 
    '续签功能索引数量' as '项目',
    COUNT(DISTINCT INDEX_NAME) as '数量'
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'contracts'
  AND INDEX_NAME LIKE 'idx_contracts_%';

-- ================================================================
-- 验证说明：
-- 
-- 1. 字段验证：确认所有必要字段都已正确添加
-- 2. 索引验证：确认性能优化索引都已创建
-- 3. 类型验证：确认字段类型和约束正确
-- 4. 完整性验证：确认整体表结构完整
-- 
-- 使用方法：
-- 在执行完 mysql_init.sql 后运行此验证脚本
-- ================================================================