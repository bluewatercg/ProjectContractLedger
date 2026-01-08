-- ========================================================================
-- 合同管理系统数据库结构查询脚本
-- ========================================================================
-- 功能说明：快速查看当前数据库表结构和数据分布情况
-- 使用场景：开发调试、运维检查、业务分析
-- 更新时间：2024年8月26日
-- 版本：v2.0 - 包含提醒功能字段
-- ========================================================================

-- 设置查询结果显示格式
SET SESSION group_concat_max_len = 10000;

SELECT '=================== 数据库结构概览 ===================' as section_title;

-- ========================================================================
-- 核心业务表结构
-- ========================================================================

-- 1. 客户表结构
SELECT '1. 客户表 (customers) 结构' as table_info;
SELECT 
    COLUMN_NAME as '字段名',
    DATA_TYPE as '数据类型',
    CASE 
        WHEN IS_NULLABLE = 'YES' THEN '是' 
        ELSE '否' 
    END as '可为空',
    COLUMN_DEFAULT as '默认值',
    COLUMN_COMMENT as '字段说明'
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'customers'
ORDER BY ORDINAL_POSITION;

-- 2. 合同表结构（重点关注新增字段）
SELECT '2. 合同表 (contracts) 结构 - ⭐ 重点关注新增字段' as table_info;
SELECT 
    COLUMN_NAME as '字段名',
    DATA_TYPE as '数据类型',
    CASE 
        WHEN IS_NULLABLE = 'YES' THEN '是' 
        ELSE '否' 
    END as '可为空',
    COLUMN_DEFAULT as '默认值',
    COLUMN_COMMENT as '字段说明',
    CASE 
        WHEN COLUMN_NAME IN ('is_renewable', 'renewal_reminder_days') THEN '🆕 新增'
        ELSE ''
    END as '状态标记'
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'contracts'
ORDER BY ORDINAL_POSITION;

-- 3. 发票表结构
SELECT '3. 发票表 (invoices) 结构' as table_info;
SELECT 
    COLUMN_NAME as '字段名',
    DATA_TYPE as '数据类型',
    CASE 
        WHEN IS_NULLABLE = 'YES' THEN '是' 
        ELSE '否' 
    END as '可为空',
    COLUMN_DEFAULT as '默认值',
    COLUMN_COMMENT as '字段说明'
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'invoices'
ORDER BY ORDINAL_POSITION;

-- 4. 支付表结构
SELECT '4. 支付表 (payments) 结构' as table_info;
SELECT 
    COLUMN_NAME as '字段名',
    DATA_TYPE as '数据类型',
    CASE 
        WHEN IS_NULLABLE = 'YES' THEN '是' 
        ELSE '否' 
    END as '可为空',
    COLUMN_DEFAULT as '默认值',
    COLUMN_COMMENT as '字段说明'
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'payments'
ORDER BY ORDINAL_POSITION;

-- ========================================================================
-- 索引结构分析
-- ========================================================================

SELECT '=================== 索引结构分析 ===================' as section_title;

-- 显示所有表的索引信息
SELECT '📊 所有表索引统计' as index_summary;
SELECT 
    TABLE_NAME as '表名',
    INDEX_NAME as '索引名',
    CASE 
        WHEN NON_UNIQUE = 0 THEN '唯一索引'
        ELSE '普通索引'
    END as '索引类型',
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as '索引字段',
    CASE 
        WHEN INDEX_NAME LIKE 'idx_contracts_%' AND INDEX_NAME IN (
            'idx_contracts_renewable',
            'idx_contracts_renewable_status', 
            'idx_contracts_end_date_renewable',
            'idx_contracts_start_date_status'
        ) THEN '🆕 提醒功能索引'
        WHEN INDEX_NAME = 'PRIMARY' THEN '🔑 主键'
        ELSE '📋 业务索引'
    END as '用途说明'
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('customers', 'contracts', 'invoices', 'payments')
GROUP BY TABLE_NAME, INDEX_NAME, NON_UNIQUE
ORDER BY TABLE_NAME, INDEX_NAME;

-- ========================================================================
-- 业务数据统计
-- ========================================================================

SELECT '=================== 业务数据统计 ===================' as section_title;

-- 客户数据统计
SELECT '📈 客户数据统计' as data_stats;
SELECT 
    status as '客户状态',
    COUNT(*) as '数量',
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM customers), 2) as '占比%'
FROM customers 
GROUP BY status
ORDER BY COUNT(*) DESC;

-- 合同数据统计（重点关注新字段）
SELECT '📊 合同数据统计 - ⭐ 包含续签标识分析' as data_stats;
SELECT 
    status as '合同状态',
    SUM(CASE WHEN is_renewable = 1 THEN 1 ELSE 0 END) as '续签合同数',
    SUM(CASE WHEN is_renewable = 0 THEN 1 ELSE 0 END) as '一次性合同数',
    COUNT(*) as '状态总计',
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM contracts), 2) as '占比%'
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

-- 续签提醒天数分布
SELECT '⏰ 续签提醒天数配置分布' as data_stats;
SELECT 
    CASE 
        WHEN is_renewable = 1 THEN '续签合同'
        ELSE '一次性合同'
    END as '合同类型',
    renewal_reminder_days as '提醒天数',
    COUNT(*) as '数量',
    CASE renewal_reminder_days
        WHEN '5' THEN '🔴 紧急提醒'
        WHEN '30' THEN '🟡 常规提醒'
        WHEN '60' THEN '🟢 提前预警'
        ELSE '⚪ 未设置'
    END as '提醒级别'
FROM contracts 
GROUP BY is_renewable, renewal_reminder_days
ORDER BY is_renewable DESC, renewal_reminder_days;

-- 发票数据统计
SELECT '💰 发票数据统计' as data_stats;
SELECT 
    status as '发票状态',
    COUNT(*) as '数量',
    SUM(total_amount) as '总金额',
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM invoices), 2) as '占比%'
FROM invoices 
GROUP BY status
ORDER BY COUNT(*) DESC;

-- 支付数据统计
SELECT '💳 支付数据统计' as data_stats;
SELECT 
    payment_method as '支付方式',
    status as '支付状态',
    COUNT(*) as '笔数',
    SUM(amount) as '总金额'
FROM payments 
GROUP BY payment_method, status
ORDER BY payment_method, status;

-- ========================================================================
-- 提醒业务逻辑验证
-- ========================================================================

SELECT '=================== 提醒业务逻辑验证 ===================' as section_title;

-- 即将到期的续签合同
SELECT '🔔 即将到期的续签合同（未来90天内）' as reminder_check;
SELECT 
    contract_number as '合同编号',
    title as '合同标题',
    customer_id as '客户ID',
    end_date as '到期日期',
    renewal_reminder_days as '提醒天数',
    DATEDIFF(end_date, NOW()) as '剩余天数',
    CASE 
        WHEN DATEDIFF(end_date, NOW()) <= 5 THEN '🔴 紧急'
        WHEN DATEDIFF(end_date, NOW()) <= 30 THEN '🟡 重要'
        WHEN DATEDIFF(end_date, NOW()) <= 60 THEN '🟢 关注'
        ELSE '⚪ 正常'
    END as '优先级'
FROM contracts 
WHERE is_renewable = TRUE 
  AND status = 'active'
  AND end_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 90 DAY)
ORDER BY end_date ASC
LIMIT 10;

-- 即将到期的一次性合同
SELECT '📅 即将到期的一次性合同（未来30天内）' as reminder_check;
SELECT 
    contract_number as '合同编号',
    title as '合同标题',
    customer_id as '客户ID',
    end_date as '到期日期',
    DATEDIFF(end_date, NOW()) as '剩余天数',
    CASE 
        WHEN DATEDIFF(end_date, NOW()) <= 7 THEN '🔴 紧急'
        WHEN DATEDIFF(end_date, NOW()) <= 15 THEN '🟡 重要'
        ELSE '🟢 关注'
    END as '优先级'
FROM contracts 
WHERE is_renewable = FALSE 
  AND status = 'active'
  AND end_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY)
ORDER BY end_date ASC
LIMIT 10;

-- 需要开票的合同
SELECT '📄 需要开票的合同（前10个）' as reminder_check;
SELECT 
    c.contract_number as '合同编号',
    c.title as '合同标题',
    c.total_amount as '合同总额',
    COALESCE(i.total_invoiced, 0) as '已开票金额',
    (c.total_amount - COALESCE(i.total_invoiced, 0)) as '待开票金额',
    DATEDIFF(NOW(), c.start_date) as '合同生效天数'
FROM contracts c
LEFT JOIN (
    SELECT contract_id, SUM(total_amount) as total_invoiced
    FROM invoices 
    GROUP BY contract_id
) i ON c.id = i.contract_id
WHERE c.status = 'active'
  AND c.start_date <= NOW()
  AND COALESCE(i.total_invoiced, 0) < c.total_amount
ORDER BY (c.total_amount - COALESCE(i.total_invoiced, 0)) DESC
LIMIT 10;

-- 需要收款的发票
SELECT '💸 需要收款的发票（前10个）' as reminder_check;
SELECT 
    inv.invoice_number as '发票编号',
    inv.total_amount as '发票总额',
    COALESCE(p.total_paid, 0) as '已收金额',
    (inv.total_amount - COALESCE(p.total_paid, 0)) as '待收金额',
    inv.status as '发票状态',
    DATEDIFF(NOW(), inv.issue_date) as '开票天数'
FROM invoices inv
LEFT JOIN (
    SELECT invoice_id, SUM(amount) as total_paid
    FROM payments 
    WHERE status = 'completed'
    GROUP BY invoice_id
) p ON inv.id = p.invoice_id
WHERE inv.status IN ('sent', 'overdue')
  AND COALESCE(p.total_paid, 0) < inv.total_amount
ORDER BY (inv.total_amount - COALESCE(p.total_paid, 0)) DESC
LIMIT 10;

-- ========================================================================
-- 系统健康检查
-- ========================================================================

SELECT '=================== 系统健康检查 ===================' as section_title;

-- 数据完整性检查
SELECT '🔍 数据完整性检查' as health_check;

-- 检查孤立的合同（客户不存在）
SELECT 
    '孤立合同检查' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ 通过'
        ELSE '❌ 发现问题'
    END as status
FROM contracts c
LEFT JOIN customers cu ON c.customer_id = cu.id
WHERE cu.id IS NULL;

-- 检查孤立的发票（合同不存在）
SELECT 
    '孤立发票检查' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ 通过'
        ELSE '❌ 发现问题'
    END as status
FROM invoices i
LEFT JOIN contracts c ON i.contract_id = c.id
WHERE c.id IS NULL;

-- 检查孤立的支付（发票不存在）
SELECT 
    '孤立支付检查' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ 通过'
        ELSE '❌ 发现问题'
    END as status
FROM payments p
LEFT JOIN invoices i ON p.invoice_id = i.id
WHERE i.id IS NULL;

-- 检查续签合同的提醒天数设置
SELECT 
    '续签合同提醒配置检查' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ 通过'
        ELSE '⚠️ 需要注意'
    END as status
FROM contracts
WHERE is_renewable = TRUE AND renewal_reminder_days IS NULL;

-- ========================================================================
-- 常用业务查询示例
-- ========================================================================

SELECT '=================== 常用业务查询示例 ===================' as section_title;

-- 客户管理查询
SELECT '📋 客户管理 - 客户列表（带合同数量统计）' as query_example;
-- 实际使用时取消注释：
/*
SELECT 
    c.*,
    COUNT(DISTINCT ct.contract_id) as contract_count,
    SUM(ct.amount) as total_contract_amount
FROM customers c
LEFT JOIN contracts ct ON c.customer_id = ct.customer_id
GROUP BY c.customer_id
ORDER BY total_contract_amount DESC;
*/

SELECT '📋 合同管理 - 合同列表（带客户信息和收款统计）' as query_example;
-- 实际使用时取消注释：
/*
SELECT 
    ct.*,
    c.name as customer_name,
    c.contact_person,
    COALESCE(SUM(p.amount), 0) as total_paid_amount,
    (ct.amount - COALESCE(SUM(p.amount), 0)) as remaining_amount
FROM contracts ct
JOIN customers c ON ct.customer_id = c.customer_id
LEFT JOIN invoices i ON ct.contract_id = i.contract_id
LEFT JOIN payments p ON i.invoice_id = p.invoice_id
GROUP BY ct.contract_id, c.name, c.contact_person
ORDER BY remaining_amount DESC;
*/

SELECT '💰 财务管理 - 收款情况统计（按合同）' as query_example;
-- 实际使用时取消注释：
/*
SELECT 
    ct.contract_id,
    ct.name as contract_name,
    ct.amount as contract_amount,
    COALESCE(SUM(p.amount), 0) as paid_amount,
    (ct.amount - COALESCE(SUM(p.amount), 0)) as remaining_amount,
    CASE 
        WHEN COALESCE(SUM(p.amount), 0) = 0 THEN '未收款'
        WHEN COALESCE(SUM(p.amount), 0) < ct.amount THEN '部分收款'
        ELSE '已收完'
    END as payment_status
FROM contracts ct
LEFT JOIN invoices i ON ct.contract_id = i.contract_id
LEFT JOIN payments p ON i.invoice_id = p.invoice_id
GROUP BY ct.contract_id, ct.name, ct.amount
ORDER BY remaining_amount DESC;
*/

SELECT '📊 业务分析 - 月度收款趋势' as query_example;
-- 实际使用时取消注释：
/*
SELECT 
    DATE_FORMAT(p.payment_date, '%Y-%m') as payment_month,
    COUNT(*) as payment_count,
    SUM(p.amount) as total_amount,
    AVG(p.amount) as avg_amount
FROM payments p
WHERE p.payment_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
GROUP BY DATE_FORMAT(p.payment_date, '%Y-%m')
ORDER BY payment_month DESC;
*/

SELECT '🔔 提醒管理 - 续签提醒查询（实用版）' as query_example;
-- 实际使用时取消注释：
/*
SELECT 
    c.contract_number as '合同编号',
    c.name as '合同名称',
    cu.name as '客户名称',
    c.end_date as '到期日期',
    DATEDIFF(c.end_date, NOW()) as '剩余天数',
    c.renewal_reminder_days as '提醒设置',
    CASE 
        WHEN DATEDIFF(c.end_date, NOW()) <= 5 THEN '🔴 紧急处理'
        WHEN DATEDIFF(c.end_date, NOW()) <= 30 THEN '🟡 需要关注'
        WHEN DATEDIFF(c.end_date, NOW()) <= 60 THEN '🟢 提前准备'
        ELSE '⚪ 正常状态'
    END as '优先级'
FROM contracts c
JOIN customers cu ON c.customer_id = cu.customer_id
WHERE c.is_renewable = TRUE 
  AND c.status = 'active'
  AND c.end_date > NOW()
ORDER BY c.end_date ASC;
*/

SELECT '=================== 数据库结构查询完成 ===================' as completion_message, NOW() as query_time;

-- ========================================================================
-- 使用说明
-- ========================================================================
/*
脚本使用说明：

1. 快速检查：
   - 直接运行此脚本即可获得完整的数据库结构和数据分布概览
   - 特别关注标记为 🆕 的新增字段和索引

2. 重点关注：
   - 合同表的 is_renewable 和 renewal_reminder_days 字段
   - 提醒功能相关的索引性能
   - 业务数据的分布是否合理

3. 健康检查：
   - 数据完整性问题需要及时处理
   - 续签合同的提醒配置需要根据业务需要调整

4. 性能监控：
   - 关注索引的使用情况
   - 监控提醒查询的性能

5. 常用查询：
   - 脚本末尾提供了常用业务查询示例
   - 取消注释即可直接使用
   - 可根据实际需求修改查询条件

6. 定期维护：
   - 建议每周运行一次此脚本
   - 根据业务发展调整合同的续签标识
   - 优化索引配置以提升查询性能
*/