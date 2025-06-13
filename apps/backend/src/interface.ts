/**
 * 通用响应接口
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code?: number;
}

/**
 * 分页查询参数
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * 分页响应数据
 */
export interface PaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 用户相关接口
 */
export interface IUserOptions {
  uid: number;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  phone?: string;
  role: string;
  status: string;
}

/**
 * 客户相关接口
 */
export interface CreateCustomerDto {
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_number?: string;
  bank_account?: string;
  bank_name?: string;
  notes?: string;
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {
  status?: string;
}

/**
 * 合同相关接口
 */
export interface CreateContractDto {
  customer_id: number;
  title: string;
  description?: string;
  total_amount: number;
  start_date: string;
  end_date: string;
  terms?: string;
  notes?: string;
}

export interface UpdateContractDto extends Partial<CreateContractDto> {
  status?: string;
}

/**
 * 发票相关接口
 */
export interface CreateInvoiceDto {
  contract_id: number;
  amount: number;
  tax_rate?: number;
  issue_date: string;
  description?: string;
  notes?: string;
}

export interface UpdateInvoiceDto extends Partial<CreateInvoiceDto> {
  status?: string;
  tax_amount?: number;
  total_amount?: number;
}

/**
 * 支付相关接口
 */
export interface CreatePaymentDto {
  invoice_id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number?: string;
  notes?: string;
}

export interface UpdatePaymentDto extends Partial<CreatePaymentDto> {
  status?: string;
}
