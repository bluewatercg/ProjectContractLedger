-- Migration: Add customer.last_contract_end_date
-- Date: 2026-05-26
-- Description: 添加客户最后合同到期日字段，用于区分"历史合作"与"停用"状态
--              由 syncCustomerStatus 自动维护

-- 1. 添加新列
ALTER TABLE customers
ADD COLUMN last_contract_end_date DATETIME NULL COMMENT '最后合同到期日期：用于区分历史合作与停用';

-- 2. 回填现有数据：查找每个客户最后到期的合同
UPDATE customers c
LEFT JOIN (
  SELECT customer_id, MAX(end_date) AS max_end_date
  FROM contracts
  WHERE end_date IS NOT NULL
  GROUP BY customer_id
) last ON c.id = last.customer_id
SET c.last_contract_end_date = last.max_end_date
WHERE last.max_end_date IS NOT NULL;

-- 3. 清除从未有合同或最后合同超过1年的客户的 last_contract_end_date
-- （这些客户应显示为"停用"而非"历史合作"）
UPDATE customers c
LEFT JOIN (
  SELECT customer_id, MAX(end_date) AS max_end_date
  FROM contracts
  WHERE end_date IS NOT NULL
  GROUP BY customer_id
) last ON c.id = last.customer_id
SET c.last_contract_end_date = NULL
WHERE last.max_end_date IS NULL
   OR last.max_end_date < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- 4. 同步 status：有 active 合同的客户设为 active
UPDATE customers c
SET c.status = CASE
  WHEN EXISTS (
    SELECT 1 FROM contracts ct
    WHERE ct.customer_id = c.id AND ct.status = 'active'
  ) THEN 'active'
  ELSE 'inactive'
END;
