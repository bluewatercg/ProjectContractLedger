-- ========================================================================
-- 合同管理系统提醒功能数据库回滚脚本
-- ========================================================================
-- 功能说明：回滚合同提醒功能相关的数据库更改
-- 执行前提：确保已备份重要业务数据
-- 执行时间：需要回滚时使用
-- 版本：v2.0 - 对应 add_contract_type_and_reminder_fields.sql 的回滚版本
-- ========================================================================

-- 开始事务
START TRANSACTION;

-- 记录回滚开始时间
SELECT '=== 开始执行合同提醒功能回滚 ===' as rollback_status, NOW() as start_time;

-- ========================================================================
-- 第一步：备份当前数据（可选，建议在重要生产环境执行）
-- ========================================================================
SELECT '步骤1：备份当前数据状态' as step;

-- 显示当前字段使用情况统计
SELECT 
    '=== 回滚前数据统计 ===' as backup_title;

SELECT 
    'is_renewable字段分布' as data_type,
    is_renewable as value,
    COUNT(*) as count
FROM contracts 
WHERE is_renewable IS NOT NULL
GROUP BY is_renewable
UNION ALL
SELECT 
    'renewal_reminder_days字段分布',
    renewal_reminder_days,
    COUNT(*)
FROM contracts 
WHERE renewal_reminder_days IS NOT NULL
GROUP BY renewal_reminder_days;

-- ========================================================================
-- 第二步：删除相关索引
-- ========================================================================
SELECT '步骤2：删除相关索引' as step;

-- 删除为提醒功能创建的索引
DROP INDEX IF EXISTS `idx_contracts_renewable` ON `contracts`;
DROP INDEX IF EXISTS `idx_contracts_renewable_status` ON `contracts`;
DROP INDEX IF EXISTS `idx_contracts_end_date_renewable` ON `contracts`;
DROP INDEX IF EXISTS `idx_contracts_start_date_status` ON `contracts`;

-- 验证索引删除结果
SELECT 
    '剩余相关索引' as index_check,
    INDEX_NAME as index_name,
    COLUMN_NAME as column_name
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'contracts' 
  AND INDEX_NAME LIKE 'idx_contracts_%'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- ========================================================================
-- 第三步：删除业务字段
-- ========================================================================
SELECT '步骤3：删除业务字段' as step;

-- 删除续签提醒天数字段
SET @sql = (
    SELECT CASE 
        WHEN COUNT(*) > 0 THEN 'ALTER TABLE `contracts` DROP COLUMN `renewal_reminder_days`'
        ELSE 'SELECT "renewal_reminder_days 字段不存在，跳过删除" as info'
    END
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'contracts' 
      AND COLUMN_NAME = 'renewal_reminder_days'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 删除是否续签字段
SET @sql = (
    SELECT CASE 
        WHEN COUNT(*) > 0 THEN 'ALTER TABLE `contracts` DROP COLUMN `is_renewable`'
        ELSE 'SELECT "is_renewable 字段不存在，跳过删除" as info'
    END
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'contracts' 
      AND COLUMN_NAME = 'is_renewable'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========================================================================
-- 第四步：验证回滚结果
-- ========================================================================
SELECT '步骤4：验证回滚结果' as step;

-- 确认字段已被删除
SELECT 
    '=== 回滚后字段验证 ===' as validation_title;

SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ 提醒功能相关字段已完全删除'
        ELSE CONCAT('❌ 仍有', COUNT(*), '个相关字段未删除')
    END as field_status
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'contracts' 
  AND COLUMN_NAME IN ('is_renewable', 'renewal_reminder_days');

-- 确认索引已被删除
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ 提醒功能相关索引已完全删除'
        ELSE CONCAT('❌ 仍有', COUNT(*), '个相关索引未删除')
    END as index_status
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'contracts' 
  AND INDEX_NAME IN (
    'idx_contracts_renewable',
    'idx_contracts_renewable_status', 
    'idx_contracts_end_date_renewable',
    'idx_contracts_start_date_status'
  );

-- 显示contracts表当前结构
SELECT 
    '=== contracts表当前字段结构 ===' as table_structure;

SELECT 
    COLUMN_NAME as '字段名',
    DATA_TYPE as '数据类型',
    IS_NULLABLE as '可为空',
    COLUMN_DEFAULT as '默认值',
    COLUMN_COMMENT as '注释'
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'contracts'
ORDER BY ORDINAL_POSITION;

-- ========================================================================
-- 第五步：影响评估
-- ========================================================================
SELECT '步骤5：影响评估' as step;

SELECT 
    '=== 回滚影响评估 ===' as impact_assessment;

-- 检查依赖这些字段的视图或存储过程（如果有）
SELECT 
    'VIEW' as object_type,
    TABLE_NAME as object_name,
    VIEW_DEFINITION as definition
FROM INFORMATION_SCHEMA.VIEWS 
WHERE TABLE_SCHEMA = DATABASE()
  AND VIEW_DEFINITION LIKE '%is_renewable%'
  OR VIEW_DEFINITION LIKE '%renewal_reminder_days%'
UNION ALL
SELECT 
    'PROCEDURE',
    ROUTINE_NAME,
    ROUTINE_DEFINITION
FROM INFORMATION_SCHEMA.ROUTINES 
WHERE ROUTINE_SCHEMA = DATABASE()
  AND (ROUTINE_DEFINITION LIKE '%is_renewable%'
  OR ROUTINE_DEFINITION LIKE '%renewal_reminder_days%');

-- 记录回滚完成时间
SELECT '=== 合同提醒功能回滚完成 ===' as rollback_status, NOW() as end_time;

-- 提交事务
COMMIT;

-- ========================================================================
-- 回滚后续说明
-- ========================================================================
/*
回滚后需要注意的事项：

1. 应用代码调整：
   - 需要移除或注释掉后端代码中对 is_renewable 和 renewal_reminder_days 字段的引用
   - 需要调整 ReminderService 中的相关业务逻辑
   - 需要更新前端页面，移除相关的续签提醒功能
   - 需要更新 Contract 实体类，移除相关字段定义

2. API接口影响：
   - /api/reminders/contract-fulfillment 接口可能需要调整
   - /api/reminders/payment-collection 接口应该不受影响
   - 合同创建和更新接口需要移除相关字段

3. 数据备份建议：
   - 如果之前有重要的续签标识数据，建议在回滚前备份
   - 可以考虑将数据导出到临时表或文件中

4. 测试验证：
   - 回滚后需要验证应用程序是否正常启动
   - 需要测试合同管理相关功能是否正常
   - 需要确认提醒功能降级为基础版本

5. 重新实施：
   - 如果需要重新实施该功能，可以重新执行 add_contract_type_and_reminder_fields.sql
   - 建议在测试环境充分验证后再在生产环境执行

6. 监控建议：
   - 回滚后密切监控系统日志，确保没有相关错误
   - 检查业务流程是否受到影响
   - 确认用户使用体验是否正常

注意：此回滚脚本不可逆，执行前请确保已经做好完整的数据备份！
*/