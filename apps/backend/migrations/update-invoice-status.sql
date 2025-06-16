-- 更新发票状态迁移脚本
-- 将现有的草稿状态发票更新为已发送状态
-- 执行时间：2025-06-16

-- 备份当前数据（可选）
-- CREATE TABLE invoices_backup_20250616 AS SELECT * FROM invoices WHERE status = 'draft';

-- 更新草稿状态的发票为已发送状态
UPDATE invoices 
SET status = 'sent', 
    updated_at = NOW()
WHERE status = 'draft';

-- 查看更新结果
SELECT 
    COUNT(*) as total_invoices,
    SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_count,
    SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_count,
    SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
    SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue_count,
    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count
FROM invoices;

-- 更新发票表的默认状态（如果需要在数据库层面修改）
-- ALTER TABLE invoices ALTER COLUMN status SET DEFAULT 'sent';
