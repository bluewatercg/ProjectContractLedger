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
  last_contract_end_date?: string | null
  notes?: string
  kit_id?: number
  created_at: string
  updated_at: string
  contracts?: Contract[]
  contractChains?: ContractChain[]
  standaloneContracts?: Contract[]
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
export interface ContractInvoicePlan {
  id: number
  kit_id: number
  contract_id: number
  phase_name: string
  pay_ratio: number
  planned_amount: number
  actual_invoiced_amount: number
  planned_invoice_date?: string | null
  remind_days_before?: number
  status: 'pending' | 'partial_invoiced' | 'invoiced' | 'cancelled' | 'bad_debt'
  first_reminded_at?: string | null
  last_reminded_at?: string | null
  created_at: string
  updated_at: string
}

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
  renewal_confirmed_at?: string
  non_renewal_reason?: string
  non_renewal_decided_by?: number
  non_renewal_decided_at?: string
  previous_contract_id?: number
  business_category_id?: number
  terms?: string
  notes?: string
  created_at: string
  updated_at: string
  customer?: Customer
  invoices?: Invoice[]
  invoice_plans?: ContractInvoicePlan[]
  previousContract?: Contract
  successorContracts?: Contract[]
  businessCategory?: BusinessCategory
  contractTimeline?: ContractTimeline
  invoicedAmount?: number
  uninvoicedAmount?: number
  paidAmount?: number
  unpaidAmount?: number
  badDebtAmount?: number
  invoiceCount?: number
  billingStatus?: string
  billingStatusText?: string
  invoiceStats?: Array<{
    id: number
    invoice_number: string
    total_amount: number
    paidAmount: number
    status: string
  }>
}

export interface ContractTimelineItem {
  id: number
  kit_id?: number
  customer_id: number
  contract_number: string
  title: string
  total_amount: number
  status: string
  start_date?: string | null
  end_date?: string | null
  previous_contract_id?: number | null
  created_at: string
  updated_at: string
  isCurrent?: boolean
}

export interface ContractTimeline {
  chainId: string
  items: ContractTimelineItem[]
  contractCount: number
  totalAmount: number
  activeAmount: number
  rootContractId?: number
  latestContractId?: number
  hasBrokenLink: boolean
  hasCycle: boolean
}

export interface ContractChain extends ContractTimeline {}

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
  previous_contract_id?: number
  business_category_id?: number
}

export interface UpdateContractDto extends Partial<CreateContractDto> {
  status?: string
}

export interface ConfirmNonRenewalDto {
  reason: string
  previous_contract_id?: number
}

// 发票相关类型
export interface Invoice {
  id: number
  invoice_number: string
  contract_id: number
  plan_id?: number | null
  amount: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  issue_date: string
  due_date?: string
  status: string
  description?: string
  notes?: string
  bad_debt_amount?: number
  bad_debt_reason?: string
  bad_debt_handler?: number
  bad_debt_marked_at?: string
  created_at: string
  updated_at: string
  contract?: Contract
  payments?: Payment[]
}

export interface CreateInvoiceDto {
  contract_id: number
  plan_id?: number
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

// 业务类型相关类型
export interface BusinessCategory {
  id: number
  kit_id: number
  parent_id: number | null
  name: string
  sort_order: number
  status: 'active' | 'disabled'
  created_by: number
  created_at: string
  updated_at: string
  children?: BusinessCategory[]
}

export interface CreateBusinessCategoryDto {
  name: string
  parent_id?: number | null
}

export interface UpdateBusinessCategoryDto {
  name?: string
  status?: 'active' | 'disabled'
}

export interface MoveNodeDto {
  nodeId: number
  targetId: number
  dropType: 'prev' | 'inner' | 'next'
}

export interface DeleteCategoryResult {
  success: boolean
  message?: string
  contractCount?: number
}

export interface BatchSetCategoryDto {
  ids: number[]
  category_id: number | null
}


// 订阅到期提醒相关类型
export interface SubscriptionType {
  id: number
  kit_id: number
  name: string
  code: string
  is_default: boolean
  sort_order: number
  status: 'active' | 'disabled'
  created_by: number
  created_at: string
  updated_at: string
}

export interface SubscriptionRecord {
  id: number
  kit_id: number
  type_id: number
  name: string
  subject: string
  provider?: string | null
  renewal_url?: string | null
  current_expiry_date: string
  next_reminder_start_date?: string | null
  renewal_period_value: number
  renewal_period_unit: 'day' | 'month' | 'year'
  remind_days_before: number
  reminder_mode?: 'once' | 'daily'
  owner_name?: string | null
  owner_user_id?: number | null
  cc_user_ids?: string | null
  cc_names?: string | null
  cc_user_id_list?: number[]
  fee?: number | null
  notes?: string | null
  status: 'active' | 'inactive'
  created_by: number
  updated_by?: number | null
  created_at: string
  updated_at: string
  type?: SubscriptionType
  owner?: UserInfo
  renewal_log?: SubscriptionRenewalLog
  daysUntilExpiry?: number
  expiryStatus?: 'normal' | 'expiring' | 'overdue'
}

export type Subscription = SubscriptionRecord

export interface SubscriptionRenewalLog {
  id: number
  subscription_id: number
  kit_id: number
  previous_expiry_date: string
  new_expiry_date: string
  renewal_period_value: number
  renewal_period_unit: 'day' | 'month' | 'year'
  operated_by: number
  operated_at: string
  remarks?: string | null
  operator?: UserInfo
  attachments?: SubscriptionRenewalAttachment[]
}

export interface SubscriptionQuery extends PaginationQuery {
  type_id?: number
  owner_user_id?: number
  owner_name?: string
  status?: 'active' | 'inactive'
  expiry_status?: 'normal' | 'expiring' | 'overdue'
  search?: string
}

export interface CreateSubscriptionTypeDto {
  name: string
  code: string
  sort_order?: number
  status?: 'active' | 'disabled'
}

export interface UpdateSubscriptionTypeDto {
  name?: string
  sort_order?: number
  status?: 'active' | 'disabled'
}

export interface CreateSubscriptionDto {
  type_id: number
  name: string
  subject: string
  provider?: string
  renewal_url?: string
  current_expiry_date: string
  next_reminder_start_date?: string | null
  renewal_period_value: number
  renewal_period_unit: 'day' | 'month' | 'year'
  remind_days_before: number
  reminder_mode?: 'once' | 'daily'
  owner_name: string
  owner_user_id?: number
  cc_names?: string
  cc_user_ids?: number[]
  fee?: number
  notes?: string
  status?: 'active' | 'inactive'
}

export interface UpdateSubscriptionDto extends Partial<CreateSubscriptionDto> {}

export interface RenewSubscriptionDto {
  remarks?: string
}

export interface SubscriptionRenewalAttachment {
  attachment_id: number
  renewal_log_id: number | null
  renewal_record_id?: number | null
  subscription_id: number
  kit_id: number
  attachment_type: 'contract' | 'invoice'
  file_name: string
  file_path: string
  file_type?: string | null
  file_size?: number | null
  uploaded_by?: number | null
  uploaded_at: string
}


export interface SubscriptionRenewalRecord {
  id: number
  subscription_id: number
  kit_id: number
  renewal_date: string | null
  next_reminder_date: string | null
  remind_days_before: number
  reminder_mode: 'daily' | 'once'
  fee: number | null
  renewal_method: string | null
  status: 'active' | 'completed' | 'voided'
  remarks: string | null
  operated_by: number | null
  created_at: string
  updated_at: string
  operator?: {
    id: number
    username: string
  }
  attachments?: SubscriptionRenewalAttachment[]
}