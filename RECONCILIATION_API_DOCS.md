# 发票对账功能 API 文档

## 📋 API 端点列表

### 1. 自动对账 - 单张发票

**端点**: `POST /api/reconciliations/auto/:invoiceId`

**描述**: 对单张发票进行自动对账，系统会自动匹配该发票的所有已完成支付记录。

**路径参数**:
- `invoiceId` (number): 发票ID

**响应示例**:
```json
{
  "success": true,
  "message": "自动对账成功",
  "data": {
    "id": 1,
    "reconciliation_number": "REC-20260129-0001",
    "invoice_id": 123,
    "invoice_amount": 10000.00,
    "paid_amount": 10000.00,
    "difference_amount": 0.00,
    "status": "matched",
    "approval_status": "pending",
    "reconciled_at": "2026-01-29T10:00:00Z"
  }
}
```

**对账状态说明**:
- `matched`: 完全匹配（发票金额 = 已支付金额）
- `unmatched`: 未支付（已支付金额 = 0）
- `underpaid`: 少付（已支付金额 < 发票金额）
- `overpaid`: 多付（已支付金额 > 发票金额）
- `partial`: 部分支付

---

### 2. 批量自动对账

**端点**: `POST /api/reconciliations/batch-auto`

**描述**: 批量对多张发票进行自动对账。

**请求体**:
```json
{
  "invoiceIds": [123, 124, 125]
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "批量对账完成，成功: 3，失败: 0",
  "data": {
    "success": 3,
    "failed": 0,
    "results": [
      {
        "invoiceId": 123,
        "success": true,
        "reconciliation": { ... }
      },
      {
        "invoiceId": 124,
        "success": true,
        "reconciliation": { ... }
      },
      {
        "invoiceId": 125,
        "success": true,
        "reconciliation": { ... }
      }
    ]
  }
}
```

---

### 3. 手动对账

**端点**: `POST /api/reconciliations/manual`

**描述**: 手动选择支付记录进行对账，适用于需要人工确认的情况。

**请求体**:
```json
{
  "invoiceId": 123,
  "paymentIds": [456, 457],
  "differenceReason": "客户申请折扣",
  "notes": "已与客户确认"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "手动对账成功",
  "data": {
    "id": 2,
    "reconciliation_number": "REC-20260129-0002",
    "invoice_id": 123,
    "invoice_amount": 10000.00,
    "paid_amount": 9500.00,
    "difference_amount": 500.00,
    "status": "underpaid",
    "difference_reason": "客户申请折扣",
    "notes": "已与客户确认"
  }
}
```

---

### 4. 获取对账列表

**端点**: `GET /api/reconciliations`

**描述**: 获取对账记录列表，支持分页和筛选。

**查询参数**:
- `page` (number, 可选): 页码，默认 1
- `pageSize` (number, 可选): 每页数量，默认 20
- `status` (string, 可选): 对账状态筛选
- `approvalStatus` (string, 可选): 审批状态筛选
- `startDate` (string, 可选): 开始日期 (YYYY-MM-DD)
- `endDate` (string, 可选): 结束日期 (YYYY-MM-DD)

**请求示例**:
```
GET /api/reconciliations?page=1&pageSize=20&status=matched
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "reconciliation_number": "REC-20260129-0001",
      "invoice": {
        "invoice_number": "INV-2026-001",
        "contract": {
          "contract_number": "CON-2026-001",
          "customer": {
            "name": "ABC公司"
          }
        }
      },
      "invoice_amount": 10000.00,
      "paid_amount": 10000.00,
      "difference_amount": 0.00,
      "status": "matched",
      "approval_status": "pending",
      "reconciled_at": "2026-01-29T10:00:00Z",
      "reconciledByUser": {
        "username": "admin",
        "full_name": "管理员"
      }
    }
  ],
  "total": 50,
  "page": 1,
  "pageSize": 20
}
```

---

### 5. 获取对账详情

**端点**: `GET /api/reconciliations/:id`

**描述**: 获取单个对账记录的详细信息，包括对账明细。

**路径参数**:
- `id` (number): 对账记录ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "reconciliation_number": "REC-20260129-0001",
    "invoice": {
      "id": 123,
      "invoice_number": "INV-2026-001",
      "total_amount": 10000.00,
      "contract": {
        "contract_number": "CON-2026-001",
        "customer": {
          "name": "ABC公司"
        }
      }
    },
    "invoice_amount": 10000.00,
    "paid_amount": 10000.00,
    "difference_amount": 0.00,
    "status": "matched",
    "approval_status": "pending",
    "details": [
      {
        "id": 1,
        "payment": {
          "id": 456,
          "amount": 5000.00,
          "payment_date": "2026-01-15",
          "payment_method": "bank_transfer",
          "reference_number": "TXN-001"
        },
        "payment_amount": 5000.00,
        "is_matched": true
      },
      {
        "id": 2,
        "payment": {
          "id": 457,
          "amount": 5000.00,
          "payment_date": "2026-01-20",
          "payment_method": "bank_transfer",
          "reference_number": "TXN-002"
        },
        "payment_amount": 5000.00,
        "is_matched": true
      }
    ],
    "reconciled_at": "2026-01-29T10:00:00Z",
    "reconciledByUser": {
      "username": "admin",
      "full_name": "管理员"
    }
  }
}
```

---

### 6. 处理对账差异

**端点**: `PUT /api/reconciliations/:id/handle-difference`

**描述**: 处理对账差异，支持多种处理方式。

**路径参数**:
- `id` (number): 对账记录ID

**请求体**:
```json
{
  "action": "adjust_invoice",
  "reason": "客户申请折扣，已批准"
}
```

**处理方式 (action)**:
- `adjust_invoice`: 调整发票金额为实际支付金额
- `refund`: 创建退款记录（多付情况）
- `write_off`: 核销差异（小额差异）
- `wait_payment`: 等待补款（少付情况）

**响应示例**:
```json
{
  "success": true,
  "message": "差异处理成功",
  "data": {
    "id": 2,
    "status": "matched",
    "difference_reason": "客户申请折扣，已批准",
    "notes": "处理方式: adjust_invoice, 处理人: 1, 时间: 2026-01-29T10:30:00Z"
  }
}
```

---

### 7. 审批对账记录

**端点**: `PUT /api/reconciliations/:id/approve`

**描述**: 审批对账记录，适用于需要主管审批的情况。

**路径参数**:
- `id` (number): 对账记录ID

**请求体**:
```json
{
  "approved": true,
  "notes": "审批通过"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "审批通过",
  "data": {
    "id": 1,
    "approval_status": "approved",
    "approved_by": 1,
    "approved_at": "2026-01-29T11:00:00Z",
    "notes": "审批意见: 审批通过"
  }
}
```

---

### 8. 获取对账统计数据

**端点**: `GET /api/reconciliations/stats/summary`

**描述**: 获取对账统计数据，用于仪表板展示。

**响应示例**:
```json
{
  "success": true,
  "data": {
    "total": 100,
    "byStatus": [
      {
        "status": "matched",
        "count": 60,
        "totalDifference": 0
      },
      {
        "status": "underpaid",
        "count": 30,
        "totalDifference": 15000.00
      },
      {
        "status": "overpaid",
        "count": 5,
        "totalDifference": 2000.00
      },
      {
        "status": "unmatched",
        "count": 5,
        "totalDifference": 50000.00
      }
    ]
  }
}
```

---

### 9. 获取待对账发票列表

**端点**: `GET /api/reconciliations/pending-invoices`

**描述**: 获取所有待对账的发票列表，即已发送但未完全支付的发票。

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "invoiceNumber": "INV-2026-001",
      "customerName": "ABC公司",
      "contractNumber": "CON-2026-001",
      "totalAmount": 10000.00,
      "paidAmount": 5000.00,
      "remainingAmount": 5000.00,
      "status": "sent",
      "issueDate": "2026-01-01",
      "dueDate": "2026-01-31",
      "paymentCount": 1
    },
    {
      "id": 124,
      "invoiceNumber": "INV-2026-002",
      "customerName": "XYZ公司",
      "contractNumber": "CON-2026-002",
      "totalAmount": 20000.00,
      "paidAmount": 0.00,
      "remainingAmount": 20000.00,
      "status": "overdue",
      "issueDate": "2025-12-01",
      "dueDate": "2025-12-31",
      "paymentCount": 0
    }
  ]
}
```

---

## 🔐 认证和授权

所有API端点都需要JWT认证。请在请求头中包含：

```
Authorization: Bearer <your_jwt_token>
```

用户必须属于当前套账（kit）才能访问相关数据。

---

## 📊 使用流程示例

### 场景1：月末财务对账

```javascript
// 1. 获取待对账发票列表
const pendingInvoices = await fetch('/api/reconciliations/pending-invoices');

// 2. 批量自动对账
const invoiceIds = pendingInvoices.data.map(inv => inv.id);
await fetch('/api/reconciliations/batch-auto', {
  method: 'POST',
  body: JSON.stringify({ invoiceIds })
});

// 3. 获取对账列表，筛选有差异的记录
const reconciliations = await fetch('/api/reconciliations?status=underpaid');

// 4. 处理差异
for (const rec of reconciliations.data) {
  await fetch(`/api/reconciliations/${rec.id}/handle-difference`, {
    method: 'PUT',
    body: JSON.stringify({
      action: 'wait_payment',
      reason: '等待客户补款'
    })
  });
}

// 5. 导出对账报表（前端实现）
```

### 场景2：手动对账特定发票

```javascript
// 1. 获取发票的支付记录
const invoice = await fetch(`/api/invoices/${invoiceId}`);

// 2. 选择要匹配的支付记录
const selectedPaymentIds = [456, 457];

// 3. 手动对账
await fetch('/api/reconciliations/manual', {
  method: 'POST',
  body: JSON.stringify({
    invoiceId: invoiceId,
    paymentIds: selectedPaymentIds,
    differenceReason: '客户申请折扣',
    notes: '已与客户确认'
  })
});

// 4. 提交审批
const reconciliation = await fetch(`/api/reconciliations/${recId}`);
await fetch(`/api/reconciliations/${recId}/approve`, {
  method: 'PUT',
  body: JSON.stringify({
    approved: true,
    notes: '审批通过'
  })
});
```

---

## ⚠️ 注意事项

1. **自动对账规则**:
   - 只匹配状态为 `completed` 的支付记录
   - 如果发票完全匹配，会自动更新发票状态为 `paid`
   - 如果已存在对账记录，会更新而不是创建新记录

2. **差异处理**:
   - `adjust_invoice`: 会直接修改发票金额，请谨慎使用
   - `refund`: 需要配合支付模块创建退款记录
   - `write_off`: 适用于小额差异（如银行手续费）
   - `wait_payment`: 保持当前状态，等待客户补款

3. **审批流程**:
   - 对账记录创建后默认为 `pending` 状态
   - 需要主管审批后才能确认
   - 审批拒绝后可以重新处理

4. **性能优化**:
   - 批量对账建议每次不超过100张发票
   - 大批量操作建议使用后台任务
   - 对账列表支持分页，避免一次加载过多数据

---

## 🐛 错误处理

所有API在发生错误时会返回：

```json
{
  "success": false,
  "message": "错误信息"
}
```

常见错误：
- `发票不存在`: 发票ID无效或不属于当前套账
- `部分支付记录不存在`: 手动对账时选择的支付记录无效
- `对账记录不存在`: 对账记录ID无效或不属于当前套账
- `权限不足`: 用户没有权限执行该操作

---

## 📞 技术支持

如有问题，请参考：
- 后端代码: `apps/backend/src/controller/reconciliation.controller.ts`
- 服务层代码: `apps/backend/src/service/reconciliation.service.ts`
- 数据模型: `apps/backend/src/entity/reconciliation.entity.ts`
