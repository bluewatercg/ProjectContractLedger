-- MySQL 性能优化索引迁移脚本
-- 为统计查询添加必要的索引以提升性能

USE procontractledger;

-- 客户表索引
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_created_at ON customers(created_at);

-- 合同表索引
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_customer_id ON contracts(customer_id);
CREATE INDEX idx_contracts_status_amount ON contracts(status, total_amount);
CREATE INDEX idx_contracts_created_at ON contracts(created_at);

-- 发票表索引
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_contract_id ON invoices(contract_id);
CREATE INDEX idx_invoices_status_amount ON invoices(status, total_amount);
CREATE INDEX idx_invoices_dates ON invoices(issue_date, due_date);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);

-- 支付表索引
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_method ON payments(payment_method);
CREATE INDEX idx_payments_status_amount ON payments(status, amount);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- 复合索引用于常见查询模式
CREATE INDEX idx_contracts_customer_status ON contracts(customer_id, status);
CREATE INDEX idx_invoices_contract_status ON invoices(contract_id, status);
CREATE INDEX idx_payments_invoice_status ON payments(invoice_id, status);

-- 分析表以更新统计信息（MySQL）
ANALYZE TABLE customers;
ANALYZE TABLE contracts;
ANALYZE TABLE invoices;
ANALYZE TABLE payments;
