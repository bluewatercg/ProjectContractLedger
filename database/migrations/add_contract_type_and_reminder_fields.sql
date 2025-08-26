-- ========================================================================
-- 合同管理系统提醒功能数据库迁移脚本
-- ========================================================================
-- 功能说明：为合同表添加续签标识和提醒功能字段
-- 业务背景：合同管理分为两个独立维度
--   1. 项目履约状态（合同生命周期）：签订 → 履约中 → 履约完成/续签
--   2. 项目款项状态（财务收款周期）：待开票 → 已开票待收款 → 已收款
-- 
-- 执行时间：2024年8月26日
-- 版本：v2.0 - 重构版本，支持双维度业务模型
-- ========================================================================

-- 开始事务
START TRANSACTION;

-- 记录迁移开始时间
SELECT '=== 开始执行合同提醒功能迁移 ===' as migration_status, NOW() as start_time;

-- ========================================================================
-- 第一步：清理历史字段（如果存在）
-- ========================================================================
SELECT '步骤1：清理历史字段' as step;

-- 删除之前错误的字段（如果存在）
SET @sql = (
    SELECT CASE 
        WHEN COUNT(*) > 0 THEN 'ALTER TABLE `contracts` DROP COLUMN `contract_type`'
        ELSE 'SELECT "contract_type 字段不存在，跳过删除" as info'
    END
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'contracts' 
      AND COLUMN_NAME = 'contract_type'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========================================================================
-- 第二步：添加新的业务字段
-- ========================================================================
SELECT '步骤2：添加新的业务字段' as step;

-- 为合同表添加"是否续签"字段
-- 业务含义：区分一次性合同（如开发项目）和续签合同（如运维服务）
ALTER TABLE `contracts` 
ADD COLUMN IF NOT EXISTS `is_renewable` BOOLEAN NOT NULL DEFAULT FALSE 
COMMENT '是否续签合同：true-需要续签（如运维、服务合同），false-不需要续签（如开发、一次性项目）' 
AFTER `status`;

-- 为合同表添加续签提醒天数字段
-- 业务含义：针对续签合同，设置提前多少天提醒续签事宜
ALTER TABLE `contracts` 
ADD COLUMN IF NOT EXISTS `renewal_reminder_days` ENUM('5', '30', '60') NULL DEFAULT '30' 
COMMENT '续签提醒天数：5天-紧急提醒，30天-常规提醒，60天-提前预警（仅在is_renewable=true时有效）' 
AFTER `is_renewable`;

-- ========================================================================
-- 第三步：优化索引，提升查询性能
-- ========================================================================
SELECT '步骤3：优化索引配置' as step;

-- 为续签标识添加索引
CREATE INDEX IF NOT EXISTS `idx_contracts_renewable` ON `contracts` (`is_renewable`);

-- 为续签合同状态查询添加复合索引
CREATE INDEX IF NOT EXISTS `idx_contracts_renewable_status` ON `contracts` (`is_renewable`, `status`);

-- 为提醒查询优化的复合索引（按到期日期、续签标识、状态）
CREATE INDEX IF NOT EXISTS `idx_contracts_end_date_renewable` ON `contracts` (`end_date`, `is_renewable`, `status`);

-- 为履约提醒查询优化的复合索引（按开始日期、状态）
CREATE INDEX IF NOT EXISTS `idx_contracts_start_date_status` ON `contracts` (`start_date`, `status`);

-- ========================================================================
-- 第四步：智能数据初始化
-- ========================================================================
SELECT '步骤4：智能数据初始化' as step;

-- 根据合同标题和描述智能识别续签合同
-- 运维、服务、年度、维护类合同通常需要续签
UPDATE `contracts` 
SET `is_renewable` = TRUE, `renewal_reminder_days` = '30'
WHERE `is_renewable` = FALSE
  AND (
    `title` REGEXP '(运维|服务|年度|维护|support|maintenance|service)'
    OR `description` REGEXP '(运维|服务|年度|维护|support|maintenance|service)'
    OR `title` LIKE '%SLA%'
    OR `description` LIKE '%SLA%'
  );

-- 技术开发、项目实施类合同通常为一次性
UPDATE `contracts` 
SET `is_renewable` = FALSE, `renewal_reminder_days` = NULL
WHERE (
    `title` REGEXP '(开发|实施|项目|定制|develop|project|implementation)'
    OR `description` REGEXP '(开发|实施|项目|定制|develop|project|implementation)'
  )
  AND NOT (
    `title` REGEXP '(运维|服务|年度|维护|support|maintenance|service)'
    OR `description` REGEXP '(运维|服务|年度|维护|support|maintenance|service)'
  );

-- ========================================================================
-- 第五步：数据验证和完整性检查
-- ========================================================================
SELECT '步骤5：数据验证和完整性检查' as step;

-- 验证字段是否成功添加
SELECT 
    COLUMN_NAME as '字段名',
    DATA_TYPE as '数据类型',
    IS_NULLABLE as '可为空',
    COLUMN_DEFAULT as '默认值',
    COLUMN_COMMENT as '注释'
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'contracts' 
  AND COLUMN_NAME IN ('is_renewable', 'renewal_reminder_days')
ORDER BY ORDINAL_POSITION;

-- 验证索引是否成功创建
SELECT 
    INDEX_NAME as '索引名',
    COLUMN_NAME as '字段名',
    SEQ_IN_INDEX as '字段顺序'
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'contracts' 
  AND INDEX_NAME LIKE 'idx_contracts_%'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- 验证数据分布情况
SELECT 
    '=== 合同续签标识分布统计 ===' as report_title;

SELECT 
    is_renewable as '是否续签',
    CASE 
        WHEN is_renewable = 1 THEN '续签合同（运维、服务类）'
        ELSE '一次性合同（开发、项目类）'
    END as '合同类型说明',
    renewal_reminder_days as '提醒天数',
    COUNT(*) as '合同数量',
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM contracts), 2) as '占比%'
FROM contracts 
GROUP BY is_renewable, renewal_reminder_days
ORDER BY is_renewable DESC, renewal_reminder_days;

-- 显示按状态分布的统计
SELECT 
    '=== 合同状态与续签标识交叉统计 ===' as report_title;

SELECT 
    status as '合同状态',
    SUM(CASE WHEN is_renewable = 1 THEN 1 ELSE 0 END) as '续签合同数',
    SUM(CASE WHEN is_renewable = 0 THEN 1 ELSE 0 END) as '一次性合同数',
    COUNT(*) as '总计'
FROM contracts 
GROUP BY status
ORDER BY 
    CASE status 
        WHEN 'active' THEN 1 
        WHEN 'draft' THEN 2 
        WHEN 'completed' THEN 3 
        WHEN 'cancelled' THEN 4 
        ELSE 5 
    END;

-- ========================================================================
-- 第六步：业务逻辑验证
-- ========================================================================
SELECT '步骤6：业务逻辑验证' as step;

-- 验证提醒业务逻辑
SELECT 
    '=== 提醒业务逻辑验证 ===' as validation_title;

-- 即将到期的续签合同（未来90天内）
SELECT 
    '即将到期的续签合同' as '提醒类型',
    COUNT(*) as '数量'
FROM contracts 
WHERE is_renewable = TRUE 
  AND status = 'active'
  AND end_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 90 DAY);

-- 即将到期的一次性合同（未来30天内）
SELECT 
    '即将到期的一次性合同' as '提醒类型',
    COUNT(*) as '数量'
FROM contracts 
WHERE is_renewable = FALSE 
  AND status = 'active'
  AND end_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY);

-- 需要开票的合同（已生效但发票金额不足）
SELECT 
    '需要开票的合同' as '提醒类型',
    COUNT(*) as '数量'
FROM contracts c
LEFT JOIN (
    SELECT contract_id, SUM(total_amount) as total_invoiced
    FROM invoices 
    GROUP BY contract_id
) i ON c.id = i.contract_id
WHERE c.status = 'active'
  AND c.start_date <= NOW()
  AND COALESCE(i.total_invoiced, 0) < c.total_amount;

-- 需要收款的发票（已开票但未完全收款）
SELECT 
    '需要收款的发票' as '提醒类型',
    COUNT(*) as '数量'
FROM invoices inv
LEFT JOIN (
    SELECT invoice_id, SUM(amount) as total_paid
    FROM payments 
    WHERE status = 'completed'
    GROUP BY invoice_id
) p ON inv.id = p.invoice_id
WHERE inv.status IN ('sent', 'overdue')
  AND COALESCE(p.total_paid, 0) < inv.total_amount;

-- 记录迁移完成时间
SELECT '=== 合同提醒功能迁移完成 ===' as migration_status, NOW() as end_time;

-- 提交事务
COMMIT;

-- ========================================================================
-- 迁移后续说明
-- ========================================================================
/*
业务使用说明：

1. 履约类提醒（合同生命周期管理）：
   - 续签提醒：针对 is_renewable=true 的合同，在到期前按 renewal_reminder_days 设置提醒
   - 履约完成提醒：针对 is_renewable=false 的一次性合同，在到期前30天提醒确认履约完成

2. 款项类提醒（财务收款周期管理）：
   - 开票提醒：合同生效后，如果发票金额小于合同总额，提醒需要开票
   - 收款提醒：发票开具后，如果收款金额小于发票总额，提醒需要跟进收款

3. 字段使用说明：
   - is_renewable：布尔值，true表示需要续签的合同（如运维、服务类），false表示一次性合同（如开发、项目类）
   - renewal_reminder_days：枚举值，仅对续签合同有效，设置提前提醒的天数
     * '5'：紧急提醒，适用于重要客户或紧急项目
     * '30'：常规提醒，适用于大多数运维服务合同
     * '60'：提前预警，适用于需要长时间准备的续签谈判

4. 索引使用说明：
   - idx_contracts_renewable：用于按续签标识快速筛选
   - idx_contracts_renewable_status：用于按续签标识和状态联合查询
   - idx_contracts_end_date_renewable：用于提醒查询的性能优化
   - idx_contracts_start_date_status：用于开票提醒的性能优化

5. 下一步操作：
   - 可以根据实际业务需要，手动调整具体合同的 is_renewable 和 renewal_reminder_days 字段
   - 建议定期检查提醒数据的准确性，根据业务发展调整提醒逻辑
   - 可以通过后台管理界面批量修改合同的续签属性
*/