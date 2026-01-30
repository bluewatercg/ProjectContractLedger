// API响应基础类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  code?: number
}

// 分页查询参数
export interface PaginationQuery {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

// 分页响应数据
export interface PaginationResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// 用户相关类型
export interface LoginDto {
  username: string
  password: string
}

export interface RegisterDto {
  username: string
  email: string
  password: string
  full_name?: string
  phone?: string
}

export interface UserInfo {
  id: number
  username: string
  email: string
  full_name?: string
  phone?: string
  role: string
  status: string
}

export interface LoginResponse {
  token: string
  user: UserInfo
  kits?: any[]
  defaultKit?: any
}

// 客户相关类型
export interface Customer {
  id: number
  name: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  tax_number?: string
  bank_account?: string
  bank_name?: string
  status: string
  notes?: string
  kit_id?: number
  created_at: string
  updated_at: string
}

export interface CreateCustomerDto {
  name: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  tax_number?: string
  bank_account?: string
  bank_name?: string
  notes?: string
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {
  status?: string
}

// 合同相关类型
export interface Contract {
  id: number
  contract_number: string
  customer_id: number
  title: string
  description?: string
  total_amount: number
  start_date: string
  end_date: string
  status: string
  is_renewable: boolean
  renewal_reminder_days?: string
  terms?: string
  notes?: string
  created_at: string
  updated_at: string
  customer?: Customer
  invoices?: Invoice[]
}

export interface CreateContractDto {
  customer_id: number
  title: string
  description?: string
  total_amount: number
  start_date: string
  end_date: string
  is_renewable: boolean
  renewal_reminder_days?: string
  terms?: string
  notes?: string
}

export interface UpdateContractDto extends Partial<CreateContractDto> {
  status?: string
}

// 发票相关类型
export interface Invoice {
  id: number
  invoice_number: string
  contract_id: number
  amount: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  issue_date: string
  due_date?: string
  status: string
  description?: string
  notes?: string
  created_at: string
  updated_at: string
  contract?: Contract
  payments?: Payment[]
}

export interface CreateInvoiceDto {
  contract_id: number
  amount: number
  tax_rate?: number
  issue_date: string
  due_date?: string
  description?: string
  notes?: string
}

export interface UpdateInvoiceDto extends Partial<CreateInvoiceDto> {
  status?: string
  tax_amount?: number
  total_amount?: number
}

// 支付相关类型
export interface Payment {
  id: number
  invoice_id: number
  amount: number
  payment_date: string
  payment_method: string
  reference_number?: string
  notes?: string
  status: string
  created_at: string
  updated_at: string
  invoice?: Invoice
}

export interface CreatePaymentDto {
  invoice_id: number
  amount: number
  payment_date: string
  payment_method: string
  reference_number?: string
  notes?: string
}

export interface UpdatePaymentDto extends Partial<CreatePaymentDto> {
  status?: string
}

// 统计相关类型
export interface DashboardStats {
  customers: {
    total: number
    active: number
    inactive: number
  }
  contracts: {
    total: number
    active: number
    completed: number
    draft: number
    totalAmount: number
  }
  invoices: {
    total: number
    draft: number
    sent: number
    paid: number
    overdue: number
    totalAmount: number
    paidAmount: number
    unpaidAmount: number
  }
  payments: {
    total: number
    completed: number
    pending: number
    failed: number
    totalAmount: number
  }
  summary: {
    totalRevenue: number
    invoicedAmount: number
    paidAmount: number
    unpaidAmount: number
    uninvoicedAmount: number
    activeCustomers: number
    activeContracts: number
  }
}

// 对账相关类型
export interface ReconciliationDetail {
  id: number
  payment_id: number
  payment_amount: number
  payment_date: string
  payment_method: string
  reference_number?: string
  is_matched: boolean
  notes?: string
  payment?: Payment
}

export interface Reconciliation {
  id: number
  reconciliation_number: string
  invoice_id: number
  invoice_amount: number
  paid_amount: number
  difference_amount: number
  status: 'matched' | 'unmatched' | 'underpaid' | 'overpaid' | 'partial'
  approval_status: 'pending' | 'approved' | 'rejected'
  difference_reason?: string
  notes?: string
  reconciled_by: number
  reconciled_at: string
  approved_by?: number
  approved_at?: string
  created_at: string
  updated_at: string
  invoice?: Invoice
  details?: ReconciliationDetail[]
  reconciledByUser?: UserInfo
  approvedByUser?: UserInfo
}

export interface PendingInvoice {
  id: number
  invoiceNumber: string
  customerName: string
  contractNumber: string
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  status: string
  issueDate: string
  dueDate: string
  paymentCount: number
}

export interface ReconciliationStats {
  total: number
  byStatus: Array<{
    status: string
    count: number
    totalDifference: number
  }>
}

export interface ManualReconcileDto {
  invoiceId: number
  paymentIds: number[]
  differenceReason?: string
  notes?: string
}

export interface HandleDifferenceDto {
  action: 'adjust_invoice' | 'refund' | 'write_off' | 'wait_payment'
  reason: string
}

export interface ApproveReconciliationDto {
  approved: boolean
  notes?: string
}

// 报表相关类型
export interface ReportQueryParams {
  startDate?: string
  endDate?: string
  groupBy?: 'day' | 'month' | 'quarter' | 'year'
  status?: string
  customerId?: number
}

export interface ExportReportDto {
  reportType: 'contract' | 'invoice' | 'payment' | 'reconciliation' | 'financial'
  format: 'excel' | 'pdf' | 'csv'
  startDate?: string
  endDate?: string
  groupBy?: 'day' | 'month' | 'quarter' | 'year'
  filters?: string
}

export interface ReportDataItem {
  period: string
  periodLabel: string
  count?: number
  amount?: number
  [key: string]: any
}

export interface ContractReportData {
  summary: {
    totalCount: number
    totalAmount: number
    activeCount: number
    completedCount: number
    averageAmount: number
  }
  trend: ReportDataItem[]
  statusDistribution: Array<{
    status: string
    statusLabel: string
    count: number
    amount: number
    percentage: number
  }>
}

export interface InvoiceReportData {
  summary: {
    totalCount: number
    totalAmount: number
    paidCount: number
    paidAmount: number
    unpaidAmount: number
    overdueCount: number
    overdueAmount: number
  }
  trend: ReportDataItem[]
  statusDistribution: Array<{
    status: string
    statusLabel: string
    count: number
    amount: number
    percentage: number
  }>
}

export interface PaymentReportData {
  summary: {
    totalCount: number
    totalAmount: number
    completedCount: number
    completedAmount: number
    averageAmount: number
  }
  trend: ReportDataItem[]
  methodDistribution: Array<{
    method: string
    methodLabel: string
    count: number
    amount: number
    percentage: number
  }>
}

export interface ReconciliationReportData {
  summary: {
    totalCount: number
    matchedCount: number
    unmatchedCount: number
    totalDifference: number
  }
  trend: ReportDataItem[]
  statusDistribution: Array<{
    status: string
    statusLabel: string
    count: number
    percentage: number
  }>
}

export interface FinancialSummaryData {
  contracts: ContractReportData
  invoices: InvoiceReportData
  payments: PaymentReportData
  reconciliations: ReconciliationReportData
  financialHealth: {
    contractFulfillmentRate: number
    invoicePaymentRate: number
    collectionEfficiency: number
    reconciliationAccuracy: number
  }
}

