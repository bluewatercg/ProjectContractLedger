-- 核心查询场景示例

-- 客户管理

-- 查询客户列表（带合同数量统计）
SELECT 
    c.*,
    COUNT(DISTINCT ct.contract_id) as contract_count
FROM customers c
LEFT JOIN contracts ct ON c.customer_id = ct.customer_id
GROUP BY c.customer_id;

-- 查询客户详情（带最近合同）
-- 使用 ? 作为参数占位符，实际使用时替换为具体的客户ID
SELECT 
    c.*,
    ct.contract_number as contract_no,
    ct.name as contract_name,
    ct.status as contract_status
FROM customers c
LEFT JOIN contracts ct ON c.customer_id = ct.customer_id
WHERE c.customer_id = ?;

-- 合同管理

-- 查询合同列表（带客户信息和金额统计）
SELECT 
    ct.*,
    c.name as customer_name,
    c.contact_person,
    COALESCE(SUM(p.amount), 0) as total_paid_amount
FROM contracts ct
JOIN customers c ON ct.customer_id = c.customer_id
LEFT JOIN invoices i_for_sum ON ct.contract_id = i_for_sum.contract_id
LEFT JOIN payments p ON i_for_sum.invoice_id = p.invoice_id
GROUP BY ct.contract_id, c.name, c.contact_person;

-- 查询合同详情（带开票和付款信息）
-- 使用 ? 作为参数占位符，实际使用时替换为具体的合同ID
SELECT 
    ct.*,
    c.name as customer_name,
    i.invoice_number as invoice_no, -- 字段名从 invoice_no 改为 invoice_number
    i.amount as invoice_amount,
    i.status as invoice_status,
    p.amount as payment_amount,
    p.payment_date
FROM contracts ct
JOIN customers c ON ct.customer_id = c.customer_id
LEFT JOIN invoices i ON ct.contract_id = i.contract_id
LEFT JOIN payments p ON i.invoice_id = p.invoice_id -- 通过invoices表关联payments表
WHERE ct.contract_id = ?;

-- 开票管理

-- 查询开票列表（带合同、客户和开票信息）
SELECT 
    i.*,
    ct.contract_number as contract_no, -- 字段名从 contract_no 改为 contract_number
    ct.name as contract_name,
    c.name as customer_name,
    ii.company_name as invoice_title, -- 根据 mysql_init.sql, invoice_infos 表中是 company_name
    ii.tax_number
FROM invoices i
JOIN contracts ct ON i.contract_id = ct.contract_id
JOIN customers c ON ct.customer_id = c.customer_id
LEFT JOIN invoice_infos ii ON i.invoice_info_id = ii.id; -- 根据 mysql_init.sql, 表名为 invoice_infos, 主键为 id

-- 到款管理

-- 查询到款列表（带发票、合同和客户信息）
SELECT 
    p.*,
    i.invoice_number as invoice_no, -- 字段名从 invoice_no 改为 invoice_number
    ct.contract_number as contract_no, -- 字段名从 contract_no 改为 contract_number
    ct.name as contract_name,
    c.name as customer_name
FROM payments p
JOIN invoices i ON p.invoice_id = i.invoice_id
JOIN contracts ct ON i.contract_id = ct.contract_id
JOIN customers c ON ct.customer_id = c.customer_id;

-- 数据统计查询

-- 合同金额统计 (例如：查询状态为 'active' 的合同)
SELECT 
    COUNT(*) as contract_count,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount
FROM contracts
WHERE status = 'active';

-- 收款情况统计 (按合同统计)
SELECT 
    ct.contract_id,
    ct.name as contract_name,
    ct.amount as contract_amount,
    COALESCE(SUM(p.amount), 0) as paid_amount,
    (ct.amount - COALESCE(SUM(p.amount), 0)) as remaining_amount
FROM contracts ct
LEFT JOIN invoices i ON ct.contract_id = i.contract_id
LEFT JOIN payments p ON i.invoice_id = p.invoice_id
GROUP BY ct.contract_id, ct.name, ct.amount;