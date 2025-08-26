-- ========================================================================
-- 合同管理系统数据库种子数据脚本 v2.0
-- ========================================================================
-- 功能说明：为开发和测试环境提供初始化数据
-- 更新时间：2024年8月26日
-- 版本：v2.0 - 包含提醒功能字段 is_renewable 和 renewal_reminder_days
-- ========================================================================

USE procontractledger;

SELECT '开始插入种子数据...' as status, NOW() as start_time;

-- 插入客户数据
INSERT INTO customers (name, contact_person, phone, email, address, tax_number, bank_account, bank_name, status, notes) VALUES
('阿里巴巴集团', '张三', '13800138000', 'zhangsan@alibaba.com', '浙江省杭州市余杭区文三西路969号', '91330000MA27XF6Q3X', '1234567890123456789', '中国工商银行杭州分行', 'active', '重要的VIP客户，年度运维服务'),
('腾讯科技有限公司', '李四', '13900139000', 'lisi@tencent.com', '广东省深圳市南山区高新技术园', '440301108220579', '9876543210987654321', '招商银行深圳分行', 'active', '长期合作伙伴，多个开发项目'),
('百度在线网络技术公司', '王五', '13700137000', 'wangwu@baidu.com', '北京市海淀区上地十街10号', '91110000633675095N', '1122334455667788990', '中国建设银行北京分行', 'active', 'AI技术服务合作'),
('小米科技有限责任公司', '赵六', '13600136000', 'zhaoliu@xiaomi.com', '北京市海淀区清河中街68号', '91110108575650717B', '5566778899001122334', '中国银行北京分行', 'active', '硬件产品技术支持'),
('字节跳动科技有限公司', '钱七', '13500135000', 'qianqi@bytedance.com', '北京市海淀区知春路甲63号', '91110108MA003T9C1B', '3344556677889900112', '中国民生银行北京分行', 'active', '短期项目合作');

-- 插入合同数据（包含新的续签字段）
INSERT INTO contracts (
    customer_id, 
    contract_number, 
    title, 
    description, 
    total_amount, 
    start_date, 
    end_date, 
    status, 
    is_renewable, 
    renewal_reminder_days, 
    terms, 
    notes
) VALUES
-- 续签合同示例
(
    (SELECT id FROM customers WHERE name = '阿里巴巴集团'), 
    'ALI-2024-SVC-001', 
    '云计算平台年度运维服务合同', 
    '为客户提供7*24小时云计算平台运维服务，包括系统监控、故障处理、性能优化等', 
    120000.00, 
    '2024-01-01', 
    '2024-12-31', 
    'active', 
    TRUE, 
    '30',
    '按月付款，每月10日前支付当月服务费用。SLA要求：系统可用性≥99.9%', 
    '重要客户，续签合同，需要提前30天安排续签洽谈'
),
-- 一次性合同示例
(
    (SELECT id FROM customers WHERE name = '腾讯科技有限公司'), 
    'TX-2024-DEV-001', 
    '微信小程序开发项目合同', 
    '开发企业级微信小程序，包括前端界面、后端API、数据库设计等', 
    200000.00, 
    '2024-03-01', 
    '2024-08-31', 
    'active', 
    FALSE, 
    NULL,
    '分阶段付款：签约30%，UI设计完成30%，功能开发完成30%，验收通过10%', 
    '一次性开发项目，不需要续签'
),
-- 即将到期的续签合同（测试提醒功能）
(
    (SELECT id FROM customers WHERE name = '阿里巴巴集团'), 
    'ALI-2023-SVC-001', 
    '上一年度运维服务合同', 
    '2023年度云计算平台运维服务，即将到期', 
    100000.00, 
    '2023-01-01', 
    CURRENT_DATE + INTERVAL 25 DAY, -- 25天后到期，测试提醒功能
    'active', 
    TRUE, 
    '30',
    '按月付款，续签在即', 
    '即将到期的续签合同，用于测试提醒功能'
),
-- 更多合同类型示例
(
    (SELECT id FROM customers WHERE name = '百度在线网络技术公司'), 
    'BD-2024-AI-001', 
    'AI算法服务年度合同', 
    '提供机器学习算法服务，包括模型训练、优化调整、技术支持等', 
    150000.00, 
    '2024-02-01', 
    '2025-01-31', 
    'active', 
    TRUE, 
    '60',
    '按季度付款，每季度首月15日前支付当季费用', 
    '技术服务合同，提前60天开始续签准备工作'
),
(
    (SELECT id FROM customers WHERE name = '字节跳动科技有限公司'), 
    'BD-2024-CON-001', 
    '数字化转型咨询项目合同', 
    '提供企业数字化转型咨询服务，包括现状分析、方案设计、实施指导等', 
    100000.00, 
    '2024-05-01', 
    '2024-09-30', 
    'active', 
    FALSE, 
    NULL,
    '分阶段付款：签约50%，中期报告25%，最终交付25%', 
    '咨询项目，一次性交付，无需续签'
);

-- 插入发票数据
INSERT INTO invoices (contract_id, invoice_number, amount, tax_rate, tax_amount, total_amount, issue_date, status, description) VALUES
((SELECT id FROM contracts WHERE contract_number = 'ALI-2024-SVC-001'), 'INV-ALI-2024-001', 100000.00, 0.13, 13000.00, 113000.00, '2024-01-15', 'sent', '云计算平台年度运维服务费'),
((SELECT id FROM contracts WHERE contract_number = 'TX-2024-DEV-001'), 'INV-TX-2024-001', 60000.00, 0.13, 7800.00, 67800.00, '2024-03-05', 'paid', '微信小程序开发项目 - 签约款'),
((SELECT id FROM contracts WHERE contract_number = 'TX-2024-DEV-001'), 'INV-TX-2024-002', 60000.00, 0.13, 7800.00, 67800.00, '2024-05-20', 'overdue', '微信小程序开发项目 - UI设计完成款'),
((SELECT id FROM contracts WHERE contract_number = 'BD-2024-AI-001'), 'INV-BD-2024-Q1', 37500.00, 0.13, 4875.00, 42375.00, '2024-02-15', 'paid', 'AI算法服务费 - Q1季度');

-- 插入支付数据
INSERT INTO payments (invoice_id, amount, payment_date, payment_method, reference_number, status) VALUES
((SELECT id FROM invoices WHERE invoice_number = 'INV-TX-2024-001'), 67800.00, '2024-03-10', 'bank_transfer', 'TX20240310001', 'completed'),
((SELECT id FROM invoices WHERE invoice_number = 'INV-ALI-2024-001'), 50000.00, '2024-02-01', 'bank_transfer', 'ALI20240201001', 'completed'),
((SELECT id FROM invoices WHERE invoice_number = 'INV-BD-2024-Q1'), 42375.00, '2024-02-20', 'bank_transfer', 'BD20240220001', 'completed');

-- 数据验证和统计
SELECT '数据插入验证：' as check_title, 
       (SELECT COUNT(*) FROM customers) as customers,
       (SELECT COUNT(*) FROM contracts) as contracts,
       (SELECT COUNT(*) FROM invoices) as invoices,
       (SELECT COUNT(*) FROM payments) as payments;

-- 续签合同配置验证
SELECT '续签合同配置验证：' as renewal_check;
SELECT 
    contract_number as '合同编号',
    title as '合同标题',
    CASE 
        WHEN is_renewable = 1 THEN '✅ 续签合同'
        ELSE '❌ 一次性合同'
    END as '合同类型',
    renewal_reminder_days as '提醒天数',
    status as '合同状态',
    CASE 
        WHEN end_date > NOW() THEN CONCAT('还有 ', DATEDIFF(end_date, NOW()), ' 天到期')
        ELSE CONCAT('已过期 ', DATEDIFF(NOW(), end_date), ' 天')
    END as '到期状态'
FROM contracts
ORDER BY is_renewable DESC, end_date ASC;

SELECT '✅ 种子数据插入完成！' as completion_status, NOW() as end_time;

/*
种子数据说明：

1. 客户数据：5个知名科技公司作为测试客户
2. 合同数据：
   - 续签合同：阿里云运维、百度AI服务（包含即将到期的测试合同）
   - 一次性合同：腾讯开发项目、字节跳动咨询项目
   - 包含新的 is_renewable 和 renewal_reminder_days 字段数据
3. 发票数据：涵盖不同状态的发票（sent、paid、overdue）
4. 支付数据：展示部分付款、全额付款等不同场景
5. 提醒功能测试：ALI-2023-SVC-001合同即将到期，用于测试续签提醒

使用建议：
- 开发环境：可以定期运行此脚本重置测试数据
- 测试环境：确保API功能和提醒逻辑正常工作
- 生产环境：请勿使用，仅用于参考
*/