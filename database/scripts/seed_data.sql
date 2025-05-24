-- 数据库初始化种子数据

-- 切换到目标数据库
USE procontractledger;

-- 清空旧数据 (可选，根据测试需求决定是否每次都清空)
-- SET FOREIGN_KEY_CHECKS = 0;
-- TRUNCATE TABLE reminders;
-- TRUNCATE TABLE communications;
-- TRUNCATE TABLE invoice_attachments;
-- TRUNCATE TABLE contract_attachments;
-- TRUNCATE TABLE payments;
-- TRUNCATE TABLE invoices;
-- TRUNCATE TABLE contracts;
-- TRUNCATE TABLE invoice_infos;
-- TRUNCATE TABLE customers;
-- TRUNCATE TABLE users;
-- SET FOREIGN_KEY_CHECKS = 1;

-- 插入用户数据
INSERT INTO users (username, email, hashed_password, is_active) VALUES
('admin_user', 'admin@example.com', 'hashed_password_admin', TRUE),
('test_user', 'test@example.com', 'hashed_password_test', TRUE);

-- 插入客户数据
INSERT INTO customers (name, contact_person, phone, email, address, notes) VALUES
('客户A公司', '张三', '13800138000', 'zhangsan@example.com', 'A公司地址', '这是一个重要的VIP客户'),
('客户B科技', '李四', '13900139000', 'lisi@example.com', 'B科技地址', '初创公司，潜力巨大'),
('客户C服务', '王五', '13700137000', 'wangwu@example.com', 'C服务中心', NULL);

-- 插入客户发票信息数据
INSERT INTO invoice_infos (customer_id, company_name, tax_number, bank_name, bank_account, address, phone, is_default) VALUES
-- 客户A公司的发票信息
((SELECT customer_id FROM customers WHERE name = '客户A公司'), '客户A公司抬头', 'TAXID12345A', 'A银行', 'ACC1234567890A', 'A公司发票地址', '010-1234567A', TRUE),
((SELECT customer_id FROM customers WHERE name = '客户A公司'), '客户A公司备用抬头', 'TAXID67890A', 'A备用银行', 'ACC0987654321A', 'A公司备用发票地址', '010-7654321A', FALSE),
-- 客户B科技的发票信息
((SELECT customer_id FROM customers WHERE name = '客户B科技'), '客户B科技抬头', 'TAXID12345B', 'B银行', 'ACC1234567890B', 'B科技发票地址', '020-1234567B', TRUE),
-- 客户C服务的发票信息
((SELECT customer_id FROM customers WHERE name = '客户C服务'), '客户C服务抬头', 'TAXID12345C', 'C银行', 'ACC1234567890C', 'C服务发票地址', '030-1234567C', TRUE);

-- 插入合同数据
INSERT INTO contracts (customer_id, contract_number, name, amount, start_date, end_date, status, notes) VALUES
-- 客户A公司的合同
((SELECT customer_id FROM customers WHERE name = '客户A公司'), 'CON-A-2023-001', '年度服务合同A1', 50000.00, '2023-01-01 00:00:00', '2023-12-31 00:00:00', '履行中', '客户A的第一个年度服务合同'),
((SELECT customer_id FROM customers WHERE name = '客户A公司'), 'CON-A-2024-001', '年度服务合同A2', 60000.00, '2024-01-01 00:00:00', '2024-12-31 00:00:00', '草稿', '客户A的第二个年度服务合同'),
-- 客户B科技的合同
((SELECT customer_id FROM customers WHERE name = '客户B科技'), 'CON-B-2023-001', '项目开发合同B1', 120000.00, '2023-03-15 00:00:00', '2023-09-15 00:00:00', '已完成', '客户B的软件开发项目'),
-- 客户C服务的合同
((SELECT customer_id FROM customers WHERE name = '客户C服务'), 'CON-C-2024-001', '咨询服务合同C1', 30000.00, '2024-02-01 00:00:00', '2024-05-01 00:00:00', '履行中', NULL);

-- 插入发票数据
INSERT INTO invoices (contract_id, invoice_info_id, invoice_number, amount, issue_date, due_date, status, notes) VALUES
-- 合同 CON-A-2023-001 的发票
((SELECT contract_id FROM contracts WHERE contract_number = 'CON-A-2023-001'), (SELECT id FROM invoice_infos WHERE company_name = '客户A公司抬头' AND customer_id = (SELECT customer_id FROM customers WHERE name = '客户A公司')), 'INV-A-2023-001-1', 25000.00, '2023-01-15 00:00:00', '2023-02-15 00:00:00', '已开票', '第一期款项'),
((SELECT contract_id FROM contracts WHERE contract_number = 'CON-A-2023-001'), (SELECT id FROM invoice_infos WHERE company_name = '客户A公司抬头' AND customer_id = (SELECT customer_id FROM customers WHERE name = '客户A公司')), 'INV-A-2023-001-2', 25000.00, '2023-07-15 00:00:00', '2023-08-15 00:00:00', '待开票', '第二期款项'),
-- 合同 CON-B-2023-001 的发票
((SELECT contract_id FROM contracts WHERE contract_number = 'CON-B-2023-001'), (SELECT id FROM invoice_infos WHERE company_name = '客户B科技抬头' AND customer_id = (SELECT customer_id FROM customers WHERE name = '客户B科技')), 'INV-B-2023-001-1', 60000.00, '2023-03-20 00:00:00', '2023-04-20 00:00:00', '已收款', '项目首付款'),
((SELECT contract_id FROM contracts WHERE contract_number = 'CON-B-2023-001'), (SELECT id FROM invoice_infos WHERE company_name = '客户B科技抬头' AND customer_id = (SELECT customer_id FROM customers WHERE name = '客户B科技')), 'INV-B-2023-001-2', 60000.00, '2023-09-01 00:00:00', '2023-10-01 00:00:00', '已开票', '项目尾款'),
-- 合同 CON-C-2024-001 的发票
((SELECT contract_id FROM contracts WHERE contract_number = 'CON-C-2024-001'), (SELECT id FROM invoice_infos WHERE company_name = '客户C服务抬头' AND customer_id = (SELECT customer_id FROM customers WHERE name = '客户C服务')), 'INV-C-2024-001-1', 30000.00, '2024-02-05 00:00:00', '2024-03-05 00:00:00', '已开票', NULL);

-- 插入付款数据
INSERT INTO payments (invoice_id, amount, payment_date, payment_method, reference_number, notes) VALUES
-- 发票 INV-A-2023-001-1 的付款
((SELECT invoice_id FROM invoices WHERE invoice_number = 'INV-A-2023-001-1'), 25000.00, '2023-02-10 00:00:00', '银行转账', 'REF001A', '客户A第一期付款'),
-- 发票 INV-B-2023-001-1 的付款
((SELECT invoice_id FROM invoices WHERE invoice_number = 'INV-B-2023-001-1'), 60000.00, '2023-04-15 00:00:00', '支付宝', 'REF001B', '客户B项目首付款'),
-- 发票 INV-C-2024-001-1 的付款
((SELECT invoice_id FROM invoices WHERE invoice_number = 'INV-C-2024-001-1'), 15000.00, '2024-03-01 00:00:00', '微信支付', 'REF001C', '客户C部分付款');

-- 插入合同附件数据
INSERT INTO contract_attachments (contract_id, file_name, file_path) VALUES
((SELECT contract_id FROM contracts WHERE contract_number = 'CON-A-2023-001'), '合同A附件1.pdf', '/attachments/CON-A-2023-001/attachment1.pdf'),
((SELECT contract_id FROM contracts WHERE contract_number = 'CON-B-2023-001'), '合同B附件1.docx', '/attachments/CON-B-2023-001/attachment1.docx');

-- 插入发票附件数据
INSERT INTO invoice_attachments (invoice_id, file_name, file_path) VALUES
((SELECT invoice_id FROM invoices WHERE invoice_number = 'INV-A-2023-001-1'), '发票A1附件.pdf', '/attachments/INV-A-2023-001-1/invoice_attachment.pdf');

-- 插入沟通记录数据
INSERT INTO communications (customer_id, type, content, contact_time, contact_person, notes) VALUES
((SELECT customer_id FROM customers WHERE name = '客户A公司'), '电话沟通', '确认年度服务合同细节', '2022-12-20 10:00:00', '张三', '客户对价格表示满意'),
((SELECT customer_id FROM customers WHERE name = '客户B科技'), '邮件沟通', '项目需求变更讨论', '2023-04-01 14:30:00', '李四', '已发送会议纪要');

-- 插入提醒数据
INSERT INTO reminders (contract_id, type, content, remind_time, status) VALUES
((SELECT contract_id FROM contracts WHERE contract_number = 'CON-A-2023-001'), '合同到期提醒', '合同CON-A-2023-001即将于2023-12-31到期', '2023-12-01 09:00:00', 'pending'),
((SELECT contract_id FROM contracts WHERE contract_number = 'CON-A-2024-001'), '合同续约提醒', '提醒与客户A公司商议CON-A-2024-001合同的续约事宜', '2024-11-01 09:00:00', 'pending'),
((SELECT contract_id FROM contracts WHERE contract_number = 'CON-C-2024-001'), '付款提醒', '提醒客户C服务支付合同CON-C-2024-001的款项', '2024-04-20 09:00:00', 'pending');

-- 初始化数据结束