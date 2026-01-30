# 套账自动继承机制说明

## 概述

为了保证数据一致性和业务逻辑的合理性，系统实现了**套账自动继承机制**：

- **客户** → 归属某个套账
- **合同** → 自动继承客户的套账
- **发票** → 自动继承合同的套账
- **支付** → 自动继承发票的套账

## 业务逻辑

### 数据关系链

```
客户 (套账A)
  └─ 合同 (自动继承 → 套账A)
      └─ 发票 (自动继承 → 套账A)
          └─ 支付 (自动继承 → 套账A)
```

### 为什么要自动继承？

1. **数据一致性** - 一个客户的所有业务都在同一个套账下
2. **避免混乱** - 不会出现A套账的客户，合同却在B套账的情况
3. **简化操作** - 用户不需要每次都手动选择套账
4. **符合业务逻辑** - 客户归属哪条线，所有业务就在哪条线
5. **便于统计** - 按套账统计时数据完整准确

## 实现细节

### 1. 创建客户

**用户操作：**
- 在"新建客户"表单中选择"所属套账"
- 默认选中当前套账，可以修改
- 保存后套账归属不可修改

**系统行为：**
```javascript
// 客户创建时
customer.kit_id = 用户选择的套账ID
```

### 2. 创建合同

**用户操作：**
- 选择客户
- 填写合同信息
- 不需要选择套账（自动继承）

**系统行为：**
```javascript
// 合同创建时
1. 获取客户信息
2. contract.kit_id = customer.kit_id  // 自动继承客户的套账
3. 如果客户没有套账，使用当前用户的套账（兜底）
```

**后端实现：**
```typescript
// contract.controller.ts
async createContract(createContractDto) {
  let kitId = this.ctx.state?.kitId;  // 默认使用当前套账

  // 如果提供了客户ID，获取客户的套账
  if (createContractDto.customer_id) {
    const customer = await this.contractService.getCustomerById(
      createContractDto.customer_id
    );
    if (customer && customer.kit_id) {
      kitId = customer.kit_id;  // 使用客户的套账
    }
  }

  // 创建合同
  const contract = await this.contractService.createContract(
    createContractDto,
    kitId,
    userId
  );
}
```

### 3. 创建发票

**用户操作：**
- 选择合同
- 填写发票信息
- 不需要选择套账（自动继承）

**系统行为：**
```javascript
// 发票创建时
1. 获取合同信息
2. invoice.kit_id = contract.kit_id  // 自动继承合同的套账
3. 如果合同没有套账，使用当前用户的套账（兜底）
```

**后端实现：**
```typescript
// invoice.controller.ts
async createInvoice(createInvoiceDto) {
  let kitId = this.ctx.state?.kitId;  // 默认使用当前套账

  // 如果提供了合同ID，获取合同的套账
  if (createInvoiceDto.contract_id) {
    const contract = await this.invoiceService.getContractById(
      createInvoiceDto.contract_id
    );
    if (contract && contract.kit_id) {
      kitId = contract.kit_id;  // 使用合同的套账
    }
  }

  // 创建发票
  const invoice = await this.invoiceService.createInvoice(
    createInvoiceDto,
    kitId
  );
}
```

### 4. 创建支付

**用户操作：**
- 选择发票
- 填写支付信息
- 不需要选择套账（自动继承）

**系统行为：**
```javascript
// 支付创建时
1. 获取发票信息
2. payment.kit_id = invoice.kit_id  // 自动继承发票的套账
3. 如果发票没有套账，使用当前用户的套账（兜底）
```

**后端实现：**
```typescript
// payment.controller.ts
async createPayment(createPaymentDto) {
  let kitId = this.ctx.state?.kitId;  // 默认使用当前套账

  // 如果提供了发票ID，获取发票的套账
  if (createPaymentDto.invoice_id) {
    const invoice = await this.paymentService.getInvoiceById(
      createPaymentDto.invoice_id
    );
    if (invoice && invoice.kit_id) {
      kitId = invoice.kit_id;  // 使用发票的套账
    }
  }

  // 创建支付
  const payment = await this.paymentService.createPayment(
    createPaymentDto,
    kitId
  );
}
```

## 使用场景示例

### 场景 1: 为不同条线创建业务

**需求：** 用户负责A、B两条线，需要为B线的客户创建合同

**操作步骤：**
1. 创建客户时选择"B线"套账
2. 创建合同时选择该客户
3. 系统自动将合同归属到"B线"
4. 后续的发票、支付都自动归属到"B线"

**结果：** 整条业务链都在B线套账下，数据一致

### 场景 2: 跨套账查看数据

**需求：** 用户想查看所有条线的客户和合同

**操作步骤：**
1. 在客户列表打开"查看全部套账"
2. 看到所有套账的客户，表格显示套账归属
3. 在合同列表打开"查看全部套账"
4. 看到所有套账的合同，表格显示套账归属

**结果：** 可以跨套账查看，但数据归属清晰

### 场景 3: 切换套账工作

**需求：** 用户需要在A线和B线之间切换工作

**操作步骤：**
1. 在顶部套账选择器切换到"A线"
2. 看到A线的所有数据
3. 创建的新数据自动归属到A线
4. 切换到"B线"，看到B线的数据

**结果：** 数据按套账隔离，不会混淆

## 优势

### 1. 数据一致性保证

```
✅ 正确：客户(A线) → 合同(A线) → 发票(A线) → 支付(A线)
❌ 错误：客户(A线) → 合同(B线) → 发票(A线) → 支付(C线)
```

### 2. 简化用户操作

**改进前：**
- 创建客户：选择套账
- 创建合同：选择套账
- 创建发票：选择套账
- 创建支付：选择套账

**改进后：**
- 创建客户：选择套账 ✅
- 创建合同：自动继承 🎯
- 创建发票：自动继承 🎯
- 创建支付：自动继承 🎯

### 3. 避免人为错误

- 用户不会因为忘记切换套账而创建错误归属的数据
- 系统自动保证业务链的套账一致性
- 减少后期数据清理和修正的工作

### 4. 便于审计和统计

- 按套账统计时，数据完整准确
- 审计追溯时，业务链清晰
- 不会出现跨套账的异常数据

## 兜底机制

为了保证系统的健壮性，实现了兜底机制：

```typescript
// 优先级顺序
1. 使用关联对象的 kit_id（客户/合同/发票）
2. 如果关联对象没有 kit_id，使用当前用户选择的 kit_id
3. 如果都没有，返回错误提示
```

**示例：**
```typescript
let kitId = this.ctx.state?.kitId;  // 兜底：当前用户的套账

if (createContractDto.customer_id) {
  const customer = await this.getCustomerById(customer_id);
  if (customer && customer.kit_id) {
    kitId = customer.kit_id;  // 优先：客户的套账
  }
}

if (!kitId) {
  return { success: false, message: '请选择套装或选择有效的客户' };
}
```

## 特殊情况处理

### 1. 历史数据迁移

**问题：** 旧数据可能没有正确的套账归属

**解决方案：**
- 运行数据修复脚本
- 根据客户归属修正合同、发票、支付的套账
- 确保数据一致性

### 2. 跨套账业务（特殊场景）

**问题：** 极少数情况下，可能需要跨套账业务

**解决方案：**
- 当前版本不支持跨套账业务
- 如果确实需要，建议：
  - 在两个套账中分别创建客户
  - 分别管理业务
  - 通过报表汇总

### 3. 套账变更

**问题：** 客户需要从A线转移到B线

**解决方案：**
- 当前版本不支持套账变更
- 建议流程：
  1. 在B线创建新客户
  2. 将新业务关联到新客户
  3. 旧客户标记为停用
  4. 保留历史数据在A线

## 技术实现

### 后端改动

1. **contract.controller.ts**
   - 创建合同时自动获取客户的 kit_id
   - 优先使用客户的套账

2. **invoice.controller.ts**
   - 创建发票时自动获取合同的 kit_id
   - 优先使用合同的套账

3. **payment.controller.ts**
   - 创建支付时自动获取发票的 kit_id
   - 优先使用发票的套账

4. **服务层添加方法**
   - `ContractService.getCustomerById()` - 获取客户信息
   - `InvoiceService.getContractById()` - 获取合同信息
   - `PaymentService.getInvoiceById()` - 获取发票信息

### 前端改动

**建议（待实现）：**
1. 在合同/发票/支付表单中显示套账信息（只读）
2. 提示用户套账是自动继承的
3. 显示继承链：客户 → 合同 → 发票 → 支付

## 测试建议

### 测试用例

1. **正常流程测试**
   - [ ] 创建客户（选择套账A）
   - [ ] 为该客户创建合同
   - [ ] 验证合同的 kit_id = 客户的 kit_id
   - [ ] 为合同创建发票
   - [ ] 验证发票的 kit_id = 合同的 kit_id
   - [ ] 为发票创建支付
   - [ ] 验证支付的 kit_id = 发票的 kit_id

2. **跨套账查看测试**
   - [ ] 创建A线客户和业务
   - [ ] 创建B线客户和业务
   - [ ] 切换到A线，只看到A线数据
   - [ ] 切换到B线，只看到B线数据
   - [ ] 开启"查看全部"，看到所有数据

3. **兜底机制测试**
   - [ ] 测试客户没有 kit_id 的情况
   - [ ] 验证使用当前用户的 kit_id
   - [ ] 测试完全没有 kit_id 的错误提示

4. **数据一致性测试**
   - [ ] 验证整条业务链的 kit_id 一致
   - [ ] 按套账统计数据准确
   - [ ] 不会出现跨套账的异常数据

## 常见问题

### Q1: 为什么不能手动选择套账？

**A:** 为了保证数据一致性。如果允许手动选择，可能出现：
- 客户在A线，合同在B线
- 统计数据不准确
- 业务关系混乱

只有在创建客户时才能选择套账，后续业务自动继承。

### Q2: 如果客户需要转移到其他套账怎么办？

**A:** 当前版本不支持套账变更。建议：
1. 在新套账创建新客户
2. 新业务关联新客户
3. 旧客户标记为停用
4. 保留历史数据

### Q3: 能否支持跨套账业务？

**A:** 当前版本不支持。跨套账业务会导致：
- 数据关系复杂
- 统计困难
- 审计追溯困难

如果确实需要，建议在两个套账中分别管理。

### Q4: 历史数据的套账归属不对怎么办？

**A:** 需要运行数据修复脚本：
1. 根据客户的 kit_id 修正合同
2. 根据合同的 kit_id 修正发票
3. 根据发票的 kit_id 修正支付

### Q5: 查看全部套账时能否编辑其他套账的数据？

**A:** 可以。查看全部只是改变显示范围，不影响编辑权限。只要用户有该套账的权限，就可以编辑。

## 更新日志

### v1.0.0 (2024-01-30)
- ✨ 实现套账自动继承机制
- ✨ 合同自动继承客户的套账
- ✨ 发票自动继承合同的套账
- ✨ 支付自动继承发票的套账
- 🔧 添加兜底机制保证系统健壮性
- 📝 完善文档说明

## 总结

套账自动继承机制通过以下方式保证了系统的数据一致性：

1. **客户创建时** - 用户明确选择套账归属
2. **业务创建时** - 自动继承上级对象的套账
3. **数据查询时** - 按套账过滤，数据隔离
4. **跨套账查看** - 支持查看全部，但归属清晰

这样既保证了数据的一致性和准确性，又简化了用户操作，是一个符合业务逻辑的优秀设计。
