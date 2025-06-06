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
  terms?: string
  notes?: string
  created_at: string
  updated_at: string
  customer?: Customer
}

export interface CreateContractDto {
  customer_id: number
  title: string
  description?: string
  total_amount: number
  start_date: string
  end_date: string
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
  due_date: string
  status: string
  description?: string
  notes?: string
  created_at: string
  updated_at: string
  contract?: Contract
}

export interface CreateInvoiceDto {
  contract_id: number
  amount: number
  tax_rate?: number
  issue_date: string
  due_date: string
  description?: string
  notes?: string
}

export interface UpdateInvoiceDto extends Partial<CreateInvoiceDto> {
  status?: string
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
    paidAmount: number
    unpaidAmount: number
    activeCustomers: number
    activeContracts: number
  }
}
