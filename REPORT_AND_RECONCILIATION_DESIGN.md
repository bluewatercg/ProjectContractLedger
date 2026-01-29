# 报表功能和发票对账功能设计方案

## 📊 一、报表功能设计

### 1.1 财务报表模块

#### 1.1.1 应收账款报表（AR Report）

**业务场景**：
- 查看所有未收款的发票
- 按客户、合同、时间维度分析应收账款
- 账龄分析（0-30天、31-60天、61-90天、90天以上）

**数据结构**：
```typescript
interface ARReportData {
  summary: {
    totalAR: number;              // 总应收账款
    overdueAR: number;            // 逾期应收账款
    currentAR: number;            // 当期应收账款
    invoiceCount: number;         // 发票数量
  };

  byCustomer: Array<{
    customerId: number;
    customerName: string;
    totalAmount: number;          // 应收总额
    overdueAmount: number;        // 逾期金额
    invoiceCount: number;         // 发票数量
    oldestInvoiceDate: Date;      // 最早发票日期
    agingDays: number;            // 平均账龄
  }>;

  byAging: {
    current: number;              // 0-30天
    days31to60: number;           // 31-60天
    days61to90: number;           // 61-90天
    over90: number;               // 90天以上
  };

  details: Array<{
    invoiceId: number;
    invoiceNumber: string;
    customerName: string;
    contractNumber: string;
    issueDate: Date;
    dueDate: Date;
    totalAmount: number;
    paidAmount: number;           // 已支付金额
    remainingAmount: number;      // 剩余应收
    agingDays: number;            // 账龄天数
    status: string;
  }>;
}
```

**API端点**：
```
GET /api/reports/accounts-receivable
Query参数：
  - startDate: 开始日期
  - endDate: 结束日期
  - customerId: 客户ID（可选）
  - status: 发票状态（可选）
  - export: 是否导出（true/false）
```

---

#### 1.1.2 已收款报表（Payment Report）

**业务场景**：
- 查看所有已收款记录
- 按时间、客户、支付方式分析收款情况
- 收款趋势分析

**数据结构**：
```typescript
interface PaymentReportData {
  summary: {
    totalReceived: number;        // 总收款金额
    paymentCount: number;         // 收款笔数
    averageAmount: number;        // 平均收款金额
    periodStart: Date;
    periodEnd: Date;
  };

  byMonth: Array<{
    month: string;                // YYYY-MM
    amount: number;
    count: number;
  }>;

  byCustomer: Array<{
    customerId: number;
    customerName: string;
    totalAmount: number;
    paymentCount: number;
    lastPaymentDate: Date;
  }>;

  byMethod: Array<{
    method: string;               // cash, bank_transfer, etc.
    amount: number;
    count: number;
    percentage: number;
  }>;

  details: Array<{
    paymentId: number;
    paymentDate: Date;
    customerName: string;
    invoiceNumber: string;
    amount: number;
    method: string;
    referenceNumber: string;
    notes: string;
  }>;
}
```

**API端点**：
```
GET /api/reports/payments
Query参数：
  - startDate: 开始日期
  - endDate: 结束日期
  - customerId: 客户ID（可选）
  - method: 支付方式（可选）
  - export: 是否导出（true/false）
```

---

#### 1.1.3 合同执行报表（Contract Performance Report）

**业务场景**：
- 查看合同执行情况
- 分析合同完成率、开票率、收款率
- 识别问题合同

**数据结构**：
```typescript
interface ContractPerformanceData {
  summary: {
    totalContracts: number;
    activeContracts: number;
    completedContracts: number;
    totalContractValue: number;
    totalInvoiced: number;        // 已开票金额
    totalReceived: number;        // 已收款金额
    invoicingRate: number;        // 开票率 %
    collectionRate: number;       // 收款率 %
  };

  byStatus: Array<{
    status: string;
    count: number;
    totalValue: number;
  }>;

  details: Array<{
    contractId: number;
    contractNumber: string;
    customerName: string;
    title: string;
    startDate: Date;
    endDate: Date;
    totalAmount: number;
    invoicedAmount: number;       // 已开票
    receivedAmount: number;       // 已收款
    remainingAmount: number;      // 未开票
    invoicingRate: number;        // 开票率
    collectionRate: number;       // 收款率
    status: string;
    daysToExpiry: number;         // 距离到期天数
  }>;
}
```

**API端点**：
```
GET /api/reports/contract-performance
Query参数：
  - startDate: 开始日期
  - endDate: 结束日期
  - customerId: 客户ID（可选）
  - status: 合同状态（可选）
  - export: 是否导出（true/false）
```

---

#### 1.1.4 客户分析报表（Customer Analysis Report）

**业务场景**：
- 分析客户价值和贡献
- 识别优质客户和风险客户
- 客户付款行为分析

**数据结构**：
```typescript
interface CustomerAnalysisData {
  summary: {
    totalCustomers: number;
    activeCustomers: number;
    topCustomerContribution: number;  // Top 20%客户贡献率
  };

  details: Array<{
    customerId: number;
    customerName: string;
    contractCount: number;
    totalContractValue: number;
    invoiceCount: number;
    totalInvoiced: number;
    totalReceived: number;
    outstandingAmount: number;    // 未收款金额
    averagePaymentDays: number;   // 平均付款天数
    overdueCount: number;         // 逾期次数
    lastPaymentDate: Date;
    creditRating: string;         // 信用评级（优秀/良好/一般/差）
  }>;
}
```

**API端点**：
```
GET /api/reports/customer-analysis
Query参数：
  - startDate: 开始日期
  - endDate: 结束日期
  - sortBy: 排序字段（totalValue/paymentDays/overdueCount）
  - export: 是否导出（true/false）
```

---

### 1.2 数据导出功能

#### 1.2.1 Excel导出

**技术方案**：使用 `exceljs` 库

**功能特性**：
- 支持多个工作表（Sheet）
- 自动列宽调整
- 表头样式美化
- 数据格式化（日期、金额、百分比）
- 合计行
- 冻结首行

**实现示例**：
```typescript
import * as ExcelJS from 'exceljs';

async function exportToExcel(data: any[], filename: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('报表数据');

  // 设置列
  worksheet.columns = [
    { header: '发票编号', key: 'invoiceNumber', width: 20 },
    { header: '客户名称', key: 'customerName', width: 30 },
    { header: '金额', key: 'amount', width: 15, style: { numFmt: '#,##0.00' } },
    { header: '开票日期', key: 'issueDate', width: 15, style: { numFmt: 'yyyy-mm-dd' } },
    { header: '状态', key: 'status', width: 10 },
  ];

  // 添加数据
  worksheet.addRows(data);

  // 样式设置
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // 导出
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}
```

---

### 1.3 报表前端页面设计

#### 1.3.1 报表中心页面（ReportCenter.vue）

**页面结构**：
```vue
<template>
  <div class="report-center">
    <el-page-header title="报表中心" />

    <!-- 报表卡片网格 -->
    <div class="report-grid">
      <el-card class="report-card" @click="navigateTo('ar-report')">
        <el-icon><Money /></el-icon>
        <h3>应收账款报表</h3>
        <p>查看未收款发票和账龄分析</p>
      </el-card>

      <el-card class="report-card" @click="navigateTo('payment-report')">
        <el-icon><Wallet /></el-icon>
        <h3>已收款报表</h3>
        <p>查看收款记录和趋势分析</p>
      </el-card>

      <el-card class="report-card" @click="navigateTo('contract-performance')">
        <el-icon><Document /></el-icon>
        <h3>合同执行报表</h3>
        <p>分析合同完成率和收款率</p>
      </el-card>

      <el-card class="report-card" @click="navigateTo('customer-analysis')">
        <el-icon><User /></el-icon>
        <h3>客户分析报表</h3>
        <p>客户价值和付款行为分析</p>
      </el-card>
    </div>
  </div>
</template>
```

#### 1.3.2 应收账款报表页面（ARReport.vue）

**页面功能**：
- 筛选条件（日期范围、客户、状态）
- 汇总数据展示（卡片）
- 账龄分析图表（饼图/柱状图）
- 明细数据表格（分页）
- 导出Excel按钮

---

## 💰 二、发票对账功能设计

### 2.1 对账业务流程

```
1. 发票开具 → 2. 记录支付 → 3. 对账检查 → 4. 差异处理 → 5. 确认完成
```

### 2.2 对账数据模型

#### 2.2.1 对账记录表（Reconciliation Entity）

```typescript
@Entity('reconciliations')
export class Reconciliation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  kit_id: number;

  @Column({ length: 50, unique: true })
  reconciliation_number: string;  // 对账单号

  @Column()
  invoice_id: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  invoice_amount: number;         // 发票金额

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  paid_amount: number;            // 已支付金额

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  difference_amount: number;      // 差异金额

  @Column({
    type: 'enum',
    enum: ['matched', 'partial', 'overpaid', 'underpaid', 'unmatched'],
    default: 'unmatched',
  })
  status: string;                 // 对账状态

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  approval_status: string;        // 审批状态

  @Column({ type: 'text', nullable: true })
  difference_reason: string;      // 差异原因

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  reconciled_by: number;          // 对账人

  @Column({ type: 'datetime', nullable: true })
  reconciled_at: Date;            // 对账时间

  @Column({ nullable: true })
  approved_by: number;            // 审批人

  @Column({ type: 'datetime', nullable: true })
  approved_at: Date;              // 审批时间

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Kit)
  @JoinColumn({ name: 'kit_id' })
  kit: Kit;

  @ManyToOne(() => Invoice)
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reconciled_by' })
  reconciledByUser: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approved_by' })
  approvedByUser: User;

  @OneToMany(() => ReconciliationDetail, detail => detail.reconciliation)
  details: ReconciliationDetail[];
}
```

#### 2.2.2 对账明细表（ReconciliationDetail Entity）

```typescript
@Entity('reconciliation_details')
export class ReconciliationDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  reconciliation_id: number;

  @Column()
  payment_id: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  payment_amount: number;

  @Column({ type: 'datetime' })
  payment_date: Date;

  @Column({ length: 50 })
  payment_method: string;

  @Column({ length: 100, nullable: true })
  reference_number: string;

  @Column({ type: 'boolean', default: true })
  is_matched: boolean;            // 是否匹配

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Reconciliation, reconciliation => reconciliation.details)
  @JoinColumn({ name: 'reconciliation_id' })
  reconciliation: Reconciliation;

  @ManyToOne(() => Payment)
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;
}
```

---

### 2.3 对账功能模块

#### 2.3.1 自动对账

**业务逻辑**：
```typescript
async function autoReconcile(invoiceId: number) {
  // 1. 获取发票信息
  const invoice = await invoiceRepository.findOne({
    where: { id: invoiceId },
    relations: ['payments']
  });

  // 2. 计算已支付总额
  const paidAmount = invoice.payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  // 3. 计算差异
  const invoiceAmount = Number(invoice.total_amount);
  const difference = invoiceAmount - paidAmount;

  // 4. 判断对账状态
  let status: string;
  if (difference === 0) {
    status = 'matched';           // 完全匹配
  } else if (paidAmount === 0) {
    status = 'unmatched';         // 未支付
  } else if (paidAmount < invoiceAmount) {
    status = 'underpaid';         // 少付
  } else {
    status = 'overpaid';          // 多付
  }

  // 5. 创建对账记录
  const reconciliation = new Reconciliation();
  reconciliation.reconciliation_number = generateReconciliationNumber();
  reconciliation.invoice_id = invoiceId;
  reconciliation.invoice_amount = invoiceAmount;
  reconciliation.paid_amount = paidAmount;
  reconciliation.difference_amount = Math.abs(difference);
  reconciliation.status = status;

  await reconciliationRepository.save(reconciliation);

  // 6. 创建对账明细
  for (const payment of invoice.payments) {
    const detail = new ReconciliationDetail();
    detail.reconciliation_id = reconciliation.id;
    detail.payment_id = payment.id;
    detail.payment_amount = Number(payment.amount);
    detail.payment_date = payment.payment_date;
    detail.payment_method = payment.payment_method;
    detail.reference_number = payment.reference_number;
    detail.is_matched = true;

    await reconciliationDetailRepository.save(detail);
  }

  return reconciliation;
}
```

#### 2.3.2 手动对账

**业务场景**：
- 财务人员手动核对发票和支付记录
- 标记匹配的支付记录
- 记录差异原因
- 提交审批

**API端点**：
```
POST /api/reconciliations/manual
Body: {
  invoiceId: number;
  paymentIds: number[];
  differenceReason?: string;
  notes?: string;
}
```

#### 2.3.3 批量对账

**业务场景**：
- 一次性对多张发票进行对账
- 生成批量对账报告

**API端点**：
```
POST /api/reconciliations/batch
Body: {
  invoiceIds: number[];
  autoApprove?: boolean;
}
```

#### 2.3.4 对账差异处理

**差异类型**：
1. **少付（Underpaid）**
   - 原因：部分付款、折扣、扣款
   - 处理：记录差异原因，等待补款或调整发票

2. **多付（Overpaid）**
   - 原因：重复付款、错误金额
   - 处理：退款或抵扣下次发票

3. **未匹配（Unmatched）**
   - 原因：支付记录缺失、发票信息错误
   - 处理：补充支付记录或修正发票

**差异处理流程**：
```typescript
async function handleDifference(
  reconciliationId: number,
  action: 'adjust_invoice' | 'refund' | 'write_off' | 'wait_payment',
  reason: string
) {
  const reconciliation = await reconciliationRepository.findOne({
    where: { id: reconciliationId }
  });

  switch (action) {
    case 'adjust_invoice':
      // 调整发票金额
      await adjustInvoiceAmount(reconciliation.invoice_id, reconciliation.paid_amount);
      reconciliation.status = 'matched';
      break;

    case 'refund':
      // 创建退款记录
      await createRefundPayment(reconciliation.invoice_id, reconciliation.difference_amount);
      reconciliation.status = 'matched';
      break;

    case 'write_off':
      // 核销差异
      reconciliation.status = 'matched';
      break;

    case 'wait_payment':
      // 等待补款
      reconciliation.status = 'underpaid';
      break;
  }

  reconciliation.difference_reason = reason;
  await reconciliationRepository.save(reconciliation);
}
```

---

### 2.4 对账报表

#### 2.4.1 对账汇总报表

**数据结构**：
```typescript
interface ReconciliationSummary {
  totalInvoices: number;
  matchedCount: number;
  unmatchedCount: number;
  underpaidCount: number;
  overpaidCount: number;
  totalDifference: number;

  byStatus: Array<{
    status: string;
    count: number;
    totalAmount: number;
  }>;
}
```

#### 2.4.2 对账明细报表

**数据结构**：
```typescript
interface ReconciliationDetail {
  reconciliationNumber: string;
  invoiceNumber: string;
  customerName: string;
  invoiceAmount: number;
  paidAmount: number;
  differenceAmount: number;
  status: string;
  reconciledAt: Date;
  reconciledBy: string;
  approvalStatus: string;
}
```

---

### 2.5 对账前端页面设计

#### 2.5.1 对账中心页面（ReconciliationCenter.vue）

**页面功能**：
- 待对账发票列表
- 快速对账按钮
- 批量对账功能
- 对账历史查询

**页面结构**：
```vue
<template>
  <div class="reconciliation-center">
    <el-page-header title="发票对账" />

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <el-card>
        <el-statistic title="待对账发票" :value="stats.pending" />
      </el-card>
      <el-card>
        <el-statistic title="已对账" :value="stats.matched" />
      </el-card>
      <el-card>
        <el-statistic title="差异金额" :value="stats.difference" :precision="2" />
      </el-card>
    </div>

    <!-- 操作按钮 -->
    <div class="actions">
      <el-button type="primary" @click="autoReconcileAll">
        <el-icon><Check /></el-icon>
        自动对账
      </el-button>
      <el-button @click="batchReconcile">
        <el-icon><Files /></el-icon>
        批量对账
      </el-button>
      <el-button @click="exportReport">
        <el-icon><Download /></el-icon>
        导出报表
      </el-button>
    </div>

    <!-- 发票列表 -->
    <el-table :data="invoices" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" />
      <el-table-column prop="invoiceNumber" label="发票编号" />
      <el-table-column prop="customerName" label="客户" />
      <el-table-column prop="totalAmount" label="发票金额" />
      <el-table-column prop="paidAmount" label="已支付" />
      <el-table-column prop="remainingAmount" label="未支付" />
      <el-table-column prop="status" label="对账状态">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button size="small" @click="reconcile(row)">对账</el-button>
          <el-button size="small" @click="viewDetails(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
```

#### 2.5.2 对账详情页面（ReconciliationDetail.vue）

**页面功能**：
- 发票信息展示
- 支付记录列表
- 对账结果展示
- 差异处理操作

---

## 🚀 三、实施计划

### 阶段一：报表功能（2周）

**Week 1**：
- [ ] 创建报表相关数据库表（如需要）
- [ ] 实现应收账款报表API
- [ ] 实现已收款报表API
- [ ] 集成 exceljs 库
- [ ] 实现Excel导出功能

**Week 2**：
- [ ] 实现合同执行报表API
- [ ] 实现客户分析报表API
- [ ] 创建报表中心前端页面
- [ ] 创建各报表详情页面
- [ ] 集成ECharts图表展示

### 阶段二：对账功能（2周）

**Week 3**：
- [ ] 创建对账相关数据库表
- [ ] 实现自动对账逻辑
- [ ] 实现手动对账API
- [ ] 实现批量对账API
- [ ] 实现差异处理API

**Week 4**：
- [ ] 创建对账中心前端页面
- [ ] 创建对账详情页面
- [ ] 实现对账报表
- [ ] 集成审批流程（如需要）
- [ ] 测试和优化

---

## 📝 四、技术要点

### 4.1 性能优化

1. **数据库查询优化**
   - 使用索引（invoice_id, customer_id, issue_date）
   - 使用聚合查询减少数据传输
   - 分页查询大数据集

2. **缓存策略**
   - 报表数据缓存（Redis，TTL: 5分钟）
   - 对账结果缓存

3. **异步处理**
   - 大批量对账使用消息队列
   - Excel导出使用后台任务

### 4.2 数据准确性

1. **事务处理**
   - 对账操作使用数据库事务
   - 确保数据一致性

2. **并发控制**
   - 乐观锁防止并发修改
   - 版本号机制

3. **审计日志**
   - 记录所有对账操作
   - 记录差异处理操作

---

## 💡 五、使用场景示例

### 场景1：月末财务对账

```
1. 财务人员登录系统
2. 进入"对账中心"
3. 点击"自动对账"按钮
4. 系统自动对所有发票进行对账
5. 查看对账结果，筛选出有差异的发票
6. 逐一处理差异发票
7. 导出对账报表提交给主管审批
```

### 场景2：客户催款

```
1. 销售人员进入"应收账款报表"
2. 筛选特定客户的未收款发票
3. 查看账龄分析，识别逾期发票
4. 导出客户应收明细
5. 发送催款邮件给客户
```

### 场景3：月度财务分析

```
1. 管理层进入"报表中心"
2. 查看"合同执行报表"
3. 分析合同完成率和收款率
4. 查看"客户分析报表"
5. 识别优质客户和风险客户
6. 导出报表用于管理决策
```

---

## 🎯 六、预期效果

### 报表功能：
- ✅ 提供全面的财务数据分析
- ✅ 支持多维度数据查询
- ✅ 一键导出Excel报表
- ✅ 可视化图表展示

### 对账功能：
- ✅ 自动化对账，减少人工工作量
- ✅ 及时发现支付差异
- ✅ 规范差异处理流程
- ✅ 提高财务数据准确性

---

这个设计方案涵盖了报表和对账的核心功能，您觉得哪些部分需要调整或补充？我可以根据您的实际业务需求进行优化。
