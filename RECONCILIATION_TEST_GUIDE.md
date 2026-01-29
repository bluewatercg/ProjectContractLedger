# 发票对账功能 - 快速测试指南

## 🚀 快速开始

### 1. 启动后端服务

```bash
cd apps/backend
yarn dev
```

### 2. 测试API端点

使用 Postman、curl 或浏览器测试以下端点。

---

## 📝 测试步骤

### 步骤1：准备测试数据

确保数据库中有以下测试数据：
- 至少1个客户
- 至少1个合同
- 至少1张发票（状态为 `sent`）
- 至少1条支付记录（关联到发票）

### 步骤2：获取待对账发票列表

```bash
curl -X GET "http://localhost:8080/api/reconciliations/pending-invoices" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**预期结果**：返回所有待对账的发票列表

### 步骤3：自动对账单张发票

```bash
curl -X POST "http://localhost:8080/api/reconciliations/auto/123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**预期结果**：
- 创建对账记录
- 返回对账状态（matched/underpaid/overpaid/unmatched）
- 如果完全匹配，发票状态自动更新为 `paid`

### 步骤4：查看对账详情

```bash
curl -X GET "http://localhost:8080/api/reconciliations/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**预期结果**：返回对账记录详情，包括对账明细

### 步骤5：获取对账统计

```bash
curl -X GET "http://localhost:8080/api/reconciliations/stats/summary" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**预期结果**：返回对账统计数据

---

## 🧪 测试场景

### 场景1：完全匹配

**测试数据**：
- 发票金额：10000元
- 支付记录：10000元（1笔）

**操作**：自动对账

**预期结果**：
- 对账状态：`matched`
- 差异金额：0
- 发票状态自动更新为 `paid`

---

### 场景2：少付

**测试数据**：
- 发票金额：10000元
- 支付记录：5000元（1笔）

**操作**：自动对账

**预期结果**：
- 对账状态：`underpaid`
- 差异金额：5000元
- 发票状态保持 `sent`

**后续操作**：处理差异
```bash
curl -X PUT "http://localhost:8080/api/reconciliations/1/handle-difference" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "wait_payment",
    "reason": "等待客户补款"
  }'
```

---

### 场景3：多付

**测试数据**：
- 发票金额：10000元
- 支付记录：12000元（1笔或多笔）

**操作**：自动对账

**预期结果**：
- 对账状态：`overpaid`
- 差异金额：2000元

**后续操作**：处理差异
```bash
curl -X PUT "http://localhost:8080/api/reconciliations/1/handle-difference" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "refund",
    "reason": "多付退款"
  }'
```

---

### 场景4：未支付

**测试数据**：
- 发票金额：10000元
- 支付记录：无

**操作**：自动对账

**预期结果**：
- 对账状态：`unmatched`
- 已支付金额：0
- 差异金额：10000元

---

### 场景5：手动对账

**测试数据**：
- 发票金额：10000元
- 支付记录：5000元（支付ID: 456）、3000元（支付ID: 457）

**操作**：手动选择支付记录对账
```bash
curl -X POST "http://localhost:8080/api/reconciliations/manual" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceId": 123,
    "paymentIds": [456, 457],
    "differenceReason": "客户申请折扣2000元",
    "notes": "已与客户确认"
  }'
```

**预期结果**：
- 对账状态：`underpaid`
- 已支付金额：8000元
- 差异金额：2000元

---

### 场景6：批量对账

**测试数据**：
- 多张发票（ID: 123, 124, 125）

**操作**：批量自动对账
```bash
curl -X POST "http://localhost:8080/api/reconciliations/batch-auto" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceIds": [123, 124, 125]
  }'
```

**预期结果**：
- 返回每张发票的对账结果
- 统计成功和失败数量

---

### 场景7：审批流程

**操作1**：创建对账记录（自动或手动）

**操作2**：提交审批
```bash
curl -X PUT "http://localhost:8080/api/reconciliations/1/approve" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approved": true,
    "notes": "审批通过"
  }'
```

**预期结果**：
- 审批状态更新为 `approved`
- 记录审批人和审批时间

---

## 🔍 验证检查清单

### 数据库验证

```sql
-- 1. 查看对账记录
SELECT * FROM reconciliations ORDER BY created_at DESC LIMIT 10;

-- 2. 查看对账明细
SELECT * FROM reconciliation_details WHERE reconciliation_id = 1;

-- 3. 验证发票状态是否更新
SELECT id, invoice_number, status, total_amount
FROM invoices
WHERE id = 123;

-- 4. 验证支付记录关联
SELECT p.id, p.amount, p.payment_date, p.status
FROM payments p
WHERE p.invoice_id = 123;

-- 5. 统计对账状态分布
SELECT status, COUNT(*) as count, SUM(difference_amount) as total_diff
FROM reconciliations
GROUP BY status;
```

### API响应验证

检查每个API响应是否包含：
- ✅ `success` 字段
- ✅ 正确的 HTTP 状态码
- ✅ 完整的数据结构
- ✅ 正确的关联数据（invoice, customer, payments等）

### 业务逻辑验证

- ✅ 对账状态判断正确
- ✅ 差异金额计算准确
- ✅ 发票状态自动更新（完全匹配时）
- ✅ 对账明细记录完整
- ✅ 审批流程正常
- ✅ 权限控制有效（套账隔离）

---

## 🐛 常见问题排查

### 问题1：对账记录创建失败

**可能原因**：
- 发票不存在或不属于当前套账
- 数据库表未创建
- Entity未正确注册

**排查步骤**：
```bash
# 1. 检查数据库表
SHOW TABLES LIKE 'reconciliations';

# 2. 检查发票是否存在
SELECT * FROM invoices WHERE id = 123;

# 3. 检查后端日志
tail -f apps/backend/logs/midway-app.log
```

### 问题2：对账状态判断错误

**可能原因**：
- 支付记录状态不是 `completed`
- 金额计算精度问题

**排查步骤**：
```sql
-- 检查支付记录状态
SELECT id, amount, status FROM payments WHERE invoice_id = 123;

-- 手动计算总额
SELECT SUM(amount) FROM payments
WHERE invoice_id = 123 AND status = 'completed';
```

### 问题3：发票状态未自动更新

**可能原因**：
- 对账状态不是 `matched`
- 发票状态已经是 `paid`

**排查步骤**：
```sql
-- 检查对账记录
SELECT status, invoice_amount, paid_amount, difference_amount
FROM reconciliations WHERE invoice_id = 123;

-- 检查发票状态
SELECT id, status FROM invoices WHERE id = 123;
```

---

## 📊 性能测试

### 测试1：单张发票对账性能

```bash
# 使用 Apache Bench 测试
ab -n 100 -c 10 -H "Authorization: Bearer YOUR_TOKEN" \
  -p post_data.json -T application/json \
  http://localhost:8080/api/reconciliations/auto/123
```

**预期结果**：
- 平均响应时间 < 200ms
- 成功率 100%

### 测试2：批量对账性能

```bash
# 测试批量对账100张发票
time curl -X POST "http://localhost:8080/api/reconciliations/batch-auto" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"invoiceIds": [1,2,3,...,100]}'
```

**预期结果**：
- 总耗时 < 10秒
- 所有发票对账成功

---

## ✅ 测试完成检查

- [ ] 所有API端点测试通过
- [ ] 所有测试场景验证通过
- [ ] 数据库数据正确
- [ ] 业务逻辑正确
- [ ] 性能测试达标
- [ ] 错误处理正常
- [ ] 权限控制有效

---

## 📞 下一步

测试通过后，可以：
1. 创建前端对账页面
2. 集成到现有系统
3. 添加更多测试用例
4. 优化性能
5. 添加日志和监控

---

## 🎯 测试数据SQL

如果需要快速创建测试数据：

```sql
-- 创建测试客户
INSERT INTO customers (kit_id, name, contact_person, phone, email, status, created_at, updated_at)
VALUES (1, '测试公司A', '张三', '13800138000', 'test@example.com', 'active', NOW(), NOW());

-- 创建测试合同
INSERT INTO contracts (kit_id, contract_number, customer_id, title, total_amount, start_date, end_date, status, created_by, created_at, updated_at)
VALUES (1, 'CON-TEST-001', 1, '测试合同', 10000.00, '2026-01-01', '2026-12-31', 'active', 1, NOW(), NOW());

-- 创建测试发票
INSERT INTO invoices (kit_id, invoice_number, contract_id, amount, tax_rate, tax_amount, total_amount, issue_date, due_date, status, created_at, updated_at)
VALUES (1, 'INV-TEST-001', 1, 10000.00, 6.00, 600.00, 10600.00, '2026-01-01', '2026-01-31', 'sent', NOW(), NOW());

-- 创建测试支付记录（完全匹配）
INSERT INTO payments (kit_id, invoice_id, amount, payment_date, payment_method, status, created_at, updated_at)
VALUES (1, 1, 10600.00, '2026-01-15', 'bank_transfer', 'completed', NOW(), NOW());

-- 创建测试支付记录（部分支付）
INSERT INTO payments (kit_id, invoice_id, amount, payment_date, payment_method, status, created_at, updated_at)
VALUES (1, 2, 5000.00, '2026-01-15', 'bank_transfer', 'completed', NOW(), NOW());
```

---

祝测试顺利！🎉
