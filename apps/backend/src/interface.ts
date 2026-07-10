import { ApiProperty, ApiPropertyOptional } from '@midwayjs/swagger';

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

export class LoginDto {
  @ApiProperty({
    description: '用户名或邮箱',
    example: 'admin',
    maxLength: 50,
  })
  username: string;

  @ApiProperty({
    description: '密码',
    example: '123456',
    format: 'password',
    minLength: 6,
    maxLength: 50,
  })
  password: string;
}

export class RegisterDto {
  @ApiProperty({
    description: '用户名',
    example: 'newuser',
    maxLength: 50,
  })
  username: string;

  @ApiProperty({
    description: '邮箱地址',
    example: 'user@example.com',
    format: 'email',
    maxLength: 100,
  })
  email: string;

  @ApiProperty({
    description: '密码',
    example: 'password123',
    format: 'password',
    minLength: 6,
    maxLength: 50,
  })
  password: string;

  @ApiPropertyOptional({
    description: '真实姓名',
    example: '张三',
    maxLength: 50,
  })
  full_name?: string;

  @ApiPropertyOptional({
    description: '手机号码',
    example: '13812345678',
    maxLength: 20,
  })
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

export class CreateUserDto {
  @ApiProperty({
    description: '用户名',
    example: 'newuser',
    maxLength: 50,
  })
  username: string;

  @ApiProperty({
    description: '邮箱地址',
    example: 'user@example.com',
    format: 'email',
    maxLength: 100,
  })
  email: string;

  @ApiProperty({
    description: '密码',
    example: 'password123',
    format: 'password',
    minLength: 6,
    maxLength: 50,
  })
  password: string;

  @ApiPropertyOptional({
    description: '真实姓名',
    example: '张三',
    maxLength: 50,
  })
  full_name?: string;

  @ApiPropertyOptional({
    description: '手机号码',
    example: '13812345678',
    maxLength: 20,
  })
  phone?: string;

  @ApiPropertyOptional({
    description: '角色',
    example: 'user',
    enum: ['admin', 'user'],
  })
  role?: string;

  @ApiPropertyOptional({
    description: '状态',
    example: 'active',
    enum: ['active', 'inactive'],
  })
  status?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: '邮箱地址',
    example: 'user@example.com',
    format: 'email',
    maxLength: 100,
  })
  email?: string;

  @ApiPropertyOptional({
    description: '密码',
    example: 'newpassword123',
    format: 'password',
    minLength: 6,
    maxLength: 50,
  })
  password?: string;

  @ApiPropertyOptional({
    description: '真实姓名',
    example: '张三',
    maxLength: 50,
  })
  full_name?: string;

  @ApiPropertyOptional({
    description: '手机号码',
    example: '13812345678',
    maxLength: 20,
  })
  phone?: string;

  @ApiPropertyOptional({
    description: '角色',
    example: 'user',
    enum: ['admin', 'user'],
  })
  role?: string;

  @ApiPropertyOptional({
    description: '状态',
    example: 'active',
    enum: ['active', 'inactive'],
  })
  status?: string;
}

/**
 * 客户相关接口
 */
export class CreateCustomerDto {
  @ApiProperty({
    description: '客户名称',
    example: '阿里巴巴集团',
    maxLength: 100,
  })
  name: string;

  @ApiPropertyOptional({
    description: '联系人姓名',
    example: '张三',
    maxLength: 50,
  })
  contact_person?: string;

  @ApiPropertyOptional({
    description: '联系电话',
    example: '13812345678',
    maxLength: 20,
  })
  phone?: string;

  @ApiPropertyOptional({
    description: '邮箱地址',
    example: 'contact@alibaba.com',
    format: 'email',
    maxLength: 100,
  })
  email?: string;

  @ApiPropertyOptional({
    description: '客户地址',
    example: '浙江省杭州市余杭区文三西路969号',
    maxLength: 200,
  })
  address?: string;

  @ApiPropertyOptional({
    description: '税号',
    example: '91330000MA27XF6Q3X',
    maxLength: 50,
  })
  tax_number?: string;

  @ApiPropertyOptional({
    description: '银行账号',
    example: '1234567890123456789',
    maxLength: 50,
  })
  bank_account?: string;

  @ApiPropertyOptional({
    description: '开户银行',
    example: '中国工商银行杭州分行',
    maxLength: 100,
  })
  bank_name?: string;

  @ApiPropertyOptional({
    description: '备注信息',
    example: '重要客户，优先处理',
    maxLength: 500,
  })
  notes?: string;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional({
    description: '客户名称',
    example: '阿里巴巴集团',
    maxLength: 100,
  })
  name?: string;

  @ApiPropertyOptional({
    description: '联系人姓名',
    example: '张三',
    maxLength: 50,
  })
  contact_person?: string;

  @ApiPropertyOptional({
    description: '联系电话',
    example: '13812345678',
    maxLength: 20,
  })
  phone?: string;

  @ApiPropertyOptional({
    description: '邮箱地址',
    example: 'contact@alibaba.com',
    format: 'email',
    maxLength: 100,
  })
  email?: string;

  @ApiPropertyOptional({
    description: '客户地址',
    example: '浙江省杭州市余杭区文三西路969号',
    maxLength: 200,
  })
  address?: string;

  @ApiPropertyOptional({
    description: '税号',
    example: '91330000MA27XF6Q3X',
    maxLength: 50,
  })
  tax_number?: string;

  @ApiPropertyOptional({
    description: '银行账号',
    example: '1234567890123456789',
    maxLength: 50,
  })
  bank_account?: string;

  @ApiPropertyOptional({
    description: '开户银行',
    example: '中国工商银行杭州分行',
    maxLength: 100,
  })
  bank_name?: string;

  @ApiPropertyOptional({
    description: '备注信息',
    example: '重要客户，优先处理',
    maxLength: 500,
  })
  notes?: string;

  @ApiPropertyOptional({
    description: '客户状态（由系统自动计算，不可手动修改）',
    example: 'active',
    enum: ['active', 'inactive'],
  })
  status?: string;
}

/**
 * 合同相关接口
 */
export class CreateContractDto {
  @ApiProperty({
    description: '客户ID',
    example: 1,
    type: 'integer',
  })
  customer_id: number;

  @ApiProperty({
    description: '合同标题',
    example: '软件开发服务合同',
    maxLength: 200,
  })
  title: string;

  @ApiPropertyOptional({
    description: '合同描述',
    example: '为客户提供定制化软件开发服务',
    maxLength: 1000,
  })
  description?: string;

  @ApiProperty({
    description: '合同总金额（含税）',
    example: 100000.0,
    type: 'number',
    format: 'decimal',
  })
  total_amount: number;

  @ApiProperty({
    description: '合同开始日期',
    example: '2024-01-01',
    format: 'date',
  })
  start_date: string;

  @ApiProperty({
    description: '合同结束日期',
    example: '2024-12-31',
    format: 'date',
  })
  end_date: string;

  @ApiPropertyOptional({
    description: '合同条款',
    example: '按月付款，验收后7个工作日内付款',
    maxLength: 2000,
  })
  terms?: string;

  @ApiPropertyOptional({
    description: '备注信息',
    example: '重要项目，需要优先处理',
    maxLength: 500,
  })
  notes?: string;

  @ApiPropertyOptional({
    description: '是否续签合同',
    example: false,
    type: 'boolean',
    default: false,
  })
  is_renewable?: boolean;

  @ApiPropertyOptional({
    description: '续签提醒天数（仅在是否续签=true时有效）',
    example: '30',
    enum: ['5', '30', '60'],
    default: '30',
  })
  renewal_reminder_days?: string;

  @ApiPropertyOptional({
    description: '业务分类ID',
    example: 1,
    type: 'integer',
  })
  business_category_id?: number;

  @ApiPropertyOptional({
    description: '关联的旧合同ID（续签新合同）',
    example: 1,
    type: 'integer',
  })
  previous_contract_id?: number | null;
}

export class UpdateContractDto {
  @ApiPropertyOptional({
    description: '客户ID',
    example: 1,
    type: 'integer',
  })
  customer_id?: number;

  @ApiPropertyOptional({
    description: '合同标题',
    example: '软件开发服务合同',
    maxLength: 200,
  })
  title?: string;

  @ApiPropertyOptional({
    description: '合同描述',
    example: '为客户提供定制化软件开发服务',
    maxLength: 1000,
  })
  description?: string;

  @ApiPropertyOptional({
    description: '合同总金额（含税）',
    example: 100000.0,
    type: 'number',
    format: 'decimal',
  })
  total_amount?: number;

  @ApiPropertyOptional({
    description: '合同开始日期',
    example: '2024-01-01',
    format: 'date',
  })
  start_date?: string;

  @ApiPropertyOptional({
    description: '合同结束日期',
    example: '2024-12-31',
    format: 'date',
  })
  end_date?: string;

  @ApiPropertyOptional({
    description: '合同条款',
    example: '按月付款，验收后7个工作日内付款',
    maxLength: 2000,
  })
  terms?: string;

  @ApiPropertyOptional({
    description: '备注信息',
    example: '重要项目，需要优先处理',
    maxLength: 500,
  })
  notes?: string;

  @ApiPropertyOptional({
    description: '合同状态',
    example: 'active',
    enum: ['draft', 'active', 'completed', 'cancelled', 'suspended'],
  })
  status?: string;

  @ApiPropertyOptional({
    description: '是否续签合同',
    example: false,
    type: 'boolean',
  })
  is_renewable?: boolean;

  @ApiPropertyOptional({
    description: '续签提醒天数（仅在是否续签=true时有效）',
    example: '30',
    enum: ['5', '30', '60'],
  })
  renewal_reminder_days?: string;

  @ApiPropertyOptional({
    description: '业务分类ID',
    example: 1,
    type: 'integer',
  })
  business_category_id?: number;

  @ApiPropertyOptional({
    description: '关联的旧合同ID（续签新合同）',
    example: 1,
    type: 'integer',
  })
  previous_contract_id?: number | null;
}

export class ConfirmNonRenewalDto {
  @ApiProperty({
    description: '不续签原因',
    example: '客户业务调整，不再合作',
    type: 'string',
  })
  reason: string;

  @ApiPropertyOptional({
    description: '新合同ID（关联旧合同，表示替代关系）',
    example: 42,
    type: 'integer',
  })
  previous_contract_id?: number;
}

export class BatchSetCategoryDto {
  @ApiProperty({
    description: '合同ID列表',
    example: [1, 2, 3],
    isArray: true,
    type: 'integer',
  })
  ids: number[];

  @ApiPropertyOptional({
    description: '业务分类ID，传null表示清除分类',
    example: 1,
    type: 'integer',
    nullable: true,
  })
  category_id: number | null;
}

export class MarkBadDebtDto {
  @ApiProperty({
    description: '发票ID',
    example: 1,
    type: 'integer',
  })
  invoice_id: number;

  @ApiProperty({
    description: '坏账金额',
    example: 70000.0,
    type: 'number',
    format: 'decimal',
  })
  bad_debt_amount: number;

  @ApiPropertyOptional({
    description: '坏账原因',
    example: '客户经营困难，无法付款',
    type: 'string',
  })
  bad_debt_reason?: string;
}

/**
 * 发票相关接口
 */
export class CreateInvoiceDto {
  @ApiProperty({
    description: '合同ID',
    example: 1,
    type: 'integer',
  })
  contract_id: number;

  @ApiPropertyOptional({
    description: '关联的合同开票计划ID',
    example: 1,
    type: 'integer',
  })
  plan_id?: number;

  @ApiProperty({
    description: '不含税金额',
    example: 10000.0,
    type: 'number',
    format: 'decimal',
  })
  amount: number;

  @ApiPropertyOptional({
    description: '税率（%）',
    example: 13.0,
    type: 'number',
    format: 'decimal',
  })
  tax_rate?: number;

  @ApiProperty({
    description: '开票日期',
    example: '2024-01-15',
    format: 'date',
  })
  issue_date: string;

  @ApiPropertyOptional({
    description: '到期日期',
    example: '2024-02-15',
    format: 'date',
  })
  due_date?: string;

  @ApiPropertyOptional({
    description: '发票描述',
    example: '第一期款项发票',
    maxLength: 500,
  })
  description?: string;

  @ApiPropertyOptional({
    description: '备注信息',
    example: '按合同约定开具',
    maxLength: 500,
  })
  notes?: string;
}

export class UpdateInvoiceDto {
  @ApiPropertyOptional({
    description: '合同ID',
    example: 1,
    type: 'integer',
  })
  contract_id?: number;

  @ApiPropertyOptional({
    description: '关联的合同开票计划ID',
    example: 1,
    type: 'integer',
  })
  plan_id?: number;

  @ApiPropertyOptional({
    description: '不含税金额',
    example: 10000.0,
    type: 'number',
    format: 'decimal',
  })
  amount?: number;

  @ApiPropertyOptional({
    description: '税率（%）',
    example: 13.0,
    type: 'number',
    format: 'decimal',
  })
  tax_rate?: number;

  @ApiPropertyOptional({
    description: '开票日期',
    example: '2024-01-15',
    format: 'date',
  })
  issue_date?: string;

  @ApiPropertyOptional({
    description: '到期日期',
    example: '2024-02-15',
    format: 'date',
  })
  due_date?: string;

  @ApiPropertyOptional({
    description: '发票描述',
    example: '第一期款项发票',
    maxLength: 500,
  })
  description?: string;

  @ApiPropertyOptional({
    description: '备注信息',
    example: '按合同约定开具',
    maxLength: 500,
  })
  notes?: string;

  @ApiPropertyOptional({
    description: '发票状态',
    example: 'issued',
    enum: ['draft', 'issued', 'paid', 'overdue', 'cancelled'],
  })
  status?: string;

  @ApiPropertyOptional({
    description: '税额',
    example: 1300.0,
    type: 'number',
    format: 'decimal',
  })
  tax_amount?: number;

  @ApiPropertyOptional({
    description: '发票总金额（含税）',
    example: 11300.0,
    type: 'number',
    format: 'decimal',
  })
  total_amount?: number;
}

/**
 * 支付相关接口
 */
export class CreatePaymentDto {
  @ApiProperty({
    description: '发票ID',
    example: 1,
    type: 'integer',
  })
  invoice_id: number;

  @ApiProperty({
    description: '支付金额',
    example: 10000.0,
    type: 'number',
    format: 'decimal',
  })
  amount: number;

  @ApiProperty({
    description: '支付日期',
    example: '2024-01-20',
    format: 'date',
  })
  payment_date: string;

  @ApiProperty({
    description: '支付方式',
    example: 'bank_transfer',
    enum: ['bank_transfer', 'cash', 'check', 'online_payment', 'other'],
  })
  payment_method: string;

  @ApiPropertyOptional({
    description: '支付参考号/流水号',
    example: 'TXN20240120001',
    maxLength: 100,
  })
  reference_number?: string;

  @ApiPropertyOptional({
    description: '备注信息',
    example: '第一期款项支付',
    maxLength: 500,
  })
  notes?: string;
}

export class UpdatePaymentDto {
  @ApiPropertyOptional({
    description: '发票ID',
    example: 1,
    type: 'integer',
  })
  invoice_id?: number;

  @ApiPropertyOptional({
    description: '支付金额',
    example: 10000.0,
    type: 'number',
    format: 'decimal',
  })
  amount?: number;

  @ApiPropertyOptional({
    description: '支付日期',
    example: '2024-01-20',
    format: 'date',
  })
  payment_date?: string;

  @ApiPropertyOptional({
    description: '支付方式',
    example: 'bank_transfer',
    enum: ['bank_transfer', 'cash', 'check', 'online_payment', 'other'],
  })
  payment_method?: string;

  @ApiPropertyOptional({
    description: '支付参考号/流水号',
    example: 'TXN20240120001',
    maxLength: 100,
  })
  reference_number?: string;

  @ApiPropertyOptional({
    description: '备注信息',
    example: '第一期款项支付',
    maxLength: 500,
  })
  notes?: string;

  @ApiPropertyOptional({
    description: '支付状态',
    example: 'completed',
    enum: ['pending', 'completed', 'failed', 'cancelled'],
  })
  status?: string;
}

/**
 * 附件相关接口
 */
export class CreateAttachmentDto {
  @ApiProperty({
    description: '文件名称',
    example: 'contract_001.pdf',
    maxLength: 255,
  })
  file_name: string;

  @ApiProperty({
    description: '文件路径',
    example: '/uploads/contracts/2024/01/contract_001.pdf',
    maxLength: 500,
  })
  file_path: string;

  @ApiPropertyOptional({
    description: '文件类型',
    example: 'application/pdf',
    maxLength: 100,
  })
  file_type?: string;

  @ApiPropertyOptional({
    description: '文件大小（字节）',
    example: 1024000,
    type: 'integer',
  })
  file_size?: number;
}

export class AttachmentResponse {
  @ApiProperty({
    description: '附件ID',
    example: 1,
    type: 'integer',
  })
  attachment_id: number;

  @ApiProperty({
    description: '文件名称',
    example: 'contract_001.pdf',
  })
  file_name: string;

  @ApiProperty({
    description: '文件路径',
    example: '/uploads/contracts/2024/01/contract_001.pdf',
  })
  file_path: string;

  @ApiPropertyOptional({
    description: '文件类型',
    example: 'application/pdf',
  })
  file_type?: string;

  @ApiPropertyOptional({
    description: '文件大小（字节）',
    example: 1024000,
    type: 'integer',
  })
  file_size?: number;

  @ApiProperty({
    description: '上传时间',
    example: '2024-01-15T10:30:00Z',
    format: 'date-time',
  })
  uploaded_at: Date;
}

/**
 * 报表相关接口
 */
export interface ReportQueryParams {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'month' | 'quarter' | 'year';
  status?: string;
  customerId?: number;
  kitId?: number;
}

export class ExportReportDto {
  @ApiProperty({
    description: '报表类型',
    example: 'contract',
    enum: ['contract', 'invoice', 'payment', 'reconciliation', 'financial'],
  })
  reportType: string;

  @ApiProperty({
    description: '导出格式',
    example: 'excel',
    enum: ['excel', 'pdf', 'csv'],
  })
  format: string;

  @ApiPropertyOptional({
    description: '开始日期',
    example: '2024-01-01',
    format: 'date',
  })
  startDate?: string;

  @ApiPropertyOptional({
    description: '结束日期',
    example: '2024-12-31',
    format: 'date',
  })
  endDate?: string;

  @ApiPropertyOptional({
    description: '时间维度',
    example: 'month',
    enum: ['day', 'month', 'quarter', 'year'],
  })
  groupBy?: string;

  @ApiPropertyOptional({
    description: '其他筛选参数（JSON字符串）',
    example: '{"status":"active"}',
  })
  filters?: string;
}

export interface ReportDataItem {
  period: string;
  periodLabel: string;
  [key: string]: any;
}

export interface ContractReportData {
  summary: {
    totalCount: number;
    totalAmount: number;
    activeCount: number;
    completedCount: number;
    averageAmount: number;
  };
  trend: ReportDataItem[];
  statusDistribution: Array<{
    status: string;
    statusLabel: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
}

export interface InvoiceReportData {
  summary: {
    totalCount: number;
    totalAmount: number;
    paidCount: number;
    paidAmount: number;
    unpaidAmount: number;
    overdueCount: number;
    overdueAmount: number;
  };
  trend: ReportDataItem[];
  statusDistribution: Array<{
    status: string;
    statusLabel: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
}

export interface PaymentReportData {
  summary: {
    totalCount: number;
    totalAmount: number;
    completedCount: number;
    completedAmount: number;
    averageAmount: number;
  };
  trend: ReportDataItem[];
  methodDistribution: Array<{
    method: string;
    methodLabel: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
}

export interface ReconciliationReportData {
  summary: {
    totalCount: number;
    matchedCount: number;
    unmatchedCount: number;
    totalDifference: number;
  };
  trend: ReportDataItem[];
  statusDistribution: Array<{
    status: string;
    statusLabel: string;
    count: number;
    percentage: number;
  }>;
}

/**
 * 业务类型相关接口
 */
export class CreateBusinessCategoryDto {
  @ApiProperty({
    description: '分类名称',
    example: '软件开发',
    maxLength: 100,
  })
  name: string;

  @ApiPropertyOptional({
    description: '父分类ID（不传或传null表示根节点）',
    example: 1,
    type: 'integer',
  })
  parent_id?: number;
}

export class UpdateBusinessCategoryDto {
  @ApiPropertyOptional({
    description: '分类名称',
    example: '软件开发',
    maxLength: 100,
  })
  name?: string;

  @ApiPropertyOptional({
    description: '状态',
    example: 'active',
    enum: ['active', 'disabled'],
  })
  status?: 'active' | 'disabled';
}

export class MoveNodeDto {
  @ApiProperty({
    description: '被移动的节点ID',
    example: 1,
    type: 'integer',
  })
  nodeId: number;

  @ApiProperty({
    description: '目标节点ID',
    example: 2,
    type: 'integer',
  })
  targetId: number;

  @ApiProperty({
    description: '放置类型：prev-放在目标前面，inner-放入目标内部，next-放在目标后面',
    example: 'inner',
    enum: ['prev', 'inner', 'next'],
  })
  dropType: 'prev' | 'inner' | 'next';
}

/**
 * 订阅到期提醒相关接口
 */
export interface SubscriptionQuery extends PaginationQuery {
  type_id?: number;
  owner_user_id?: number;
  owner_name?: string;
  status?: 'active' | 'inactive';
  expiry_status?: 'normal' | 'expiring' | 'overdue';
  search?: string;
}

export class CreateSubscriptionTypeDto {
  @ApiProperty({
    description: '事项类型名称',
    example: 'SSL证书',
    maxLength: 50,
  })
  name: string;

  @ApiProperty({
    description: '事项类型编码，套账内唯一',
    example: 'ssl_cert',
    maxLength: 50,
  })
  code: string;

  @ApiPropertyOptional({
    description: '排序序号',
    example: 10,
    type: 'integer',
  })
  sort_order?: number;

  @ApiPropertyOptional({
    description: '状态',
    example: 'active',
    enum: ['active', 'disabled'],
  })
  status?: 'active' | 'disabled';
}

export class UpdateSubscriptionTypeDto {
  @ApiPropertyOptional({
    description: '事项类型名称',
    example: '商标续展',
    maxLength: 50,
  })
  name?: string;

  @ApiPropertyOptional({
    description: '排序序号',
    example: 20,
    type: 'integer',
  })
  sort_order?: number;

  @ApiPropertyOptional({
    description: '状态',
    example: 'active',
    enum: ['active', 'disabled'],
  })
  status?: 'active' | 'disabled';
}

export class CreateSubscriptionDto {
  @ApiProperty({ description: '事项类型ID', example: 1, type: 'integer' })
  type_id: number;

  @ApiProperty({ description: '事项名称', example: 'example.com SSL证书', maxLength: 200 })
  name: string;

  @ApiProperty({ description: '主体：账号/域名/公司名', example: 'example.com', maxLength: 200 })
  subject: string;

  @ApiPropertyOptional({ description: '供应商/服务商', example: '腾讯云', maxLength: 100 })
  provider?: string;

  @ApiPropertyOptional({ description: '续费方式', example: 'https://console.cloud.tencent.com/ssl 或线下转账', maxLength: 500 })
  renewal_url?: string;

  @ApiProperty({ description: '当前到期日', example: '2026-12-31', format: 'date' })
  current_expiry_date: string;

  @ApiPropertyOptional({ description: '下次提醒开始日，不填时按当前到期日和提前提醒天数自动计算', example: '2026-12-01', format: 'date' })
  next_reminder_start_date?: string;

  @ApiProperty({ description: '续费周期数值', example: 1, type: 'integer' })
  renewal_period_value: number;

  @ApiProperty({ description: '续费周期单位', example: 'year', enum: ['day', 'month', 'year'] })
  renewal_period_unit: 'day' | 'month' | 'year';

  @ApiProperty({ description: '提前提醒天数', example: 30, type: 'integer' })
  remind_days_before: number;

  @ApiPropertyOptional({ description: '提醒方式', example: 'daily', enum: ['once', 'daily'] })
  reminder_mode?: 'once' | 'daily';

  @ApiProperty({ description: '主负责人名称', example: '张三', maxLength: 100 })
  owner_name: string;

  @ApiPropertyOptional({ description: '历史主负责人用户ID', example: 1, type: 'integer' })
  owner_user_id?: number;

  @ApiPropertyOptional({ description: '其他负责人名称', example: '李四、王五', maxLength: 500 })
  cc_names?: string;

  @ApiPropertyOptional({ description: '历史抄送人ID列表', example: [2, 3], isArray: true, type: 'integer' })
  cc_user_ids?: number[];

  @ApiPropertyOptional({ description: '年费/单次费用', example: 1999.0, type: 'number', format: 'decimal' })
  fee?: number;

  @ApiPropertyOptional({ description: '备注', example: '自动续费需提前确认发票', maxLength: 500 })
  notes?: string;

  @ApiPropertyOptional({ description: '状态', example: 'active', enum: ['active', 'inactive'] })
  status?: 'active' | 'inactive';
}

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ description: '事项类型ID', example: 1, type: 'integer' })
  type_id?: number;

  @ApiPropertyOptional({ description: '事项名称', example: 'example.com SSL证书', maxLength: 200 })
  name?: string;

  @ApiPropertyOptional({ description: '主体：账号/域名/公司名', example: 'example.com', maxLength: 200 })
  subject?: string;

  @ApiPropertyOptional({ description: '供应商/服务商', example: '腾讯云', maxLength: 100 })
  provider?: string;

  @ApiPropertyOptional({ description: '续费方式', example: 'https://console.cloud.tencent.com/ssl 或线下转账', maxLength: 500 })
  renewal_url?: string;

  @ApiPropertyOptional({ description: '当前到期日', example: '2026-12-31', format: 'date' })
  current_expiry_date?: string;

  @ApiPropertyOptional({ description: '下次提醒开始日，不填时按当前到期日和提前提醒天数自动计算', example: '2026-12-01', format: 'date' })
  next_reminder_start_date?: string;

  @ApiPropertyOptional({ description: '续费周期数值', example: 1, type: 'integer' })
  renewal_period_value?: number;

  @ApiPropertyOptional({ description: '续费周期单位', example: 'year', enum: ['day', 'month', 'year'] })
  renewal_period_unit?: 'day' | 'month' | 'year';

  @ApiPropertyOptional({ description: '提前提醒天数', example: 30, type: 'integer' })
  remind_days_before?: number;

  @ApiPropertyOptional({ description: '提醒方式', example: 'daily', enum: ['once', 'daily'] })
  reminder_mode?: 'once' | 'daily';

  @ApiPropertyOptional({ description: '主负责人名称', example: '张三', maxLength: 100 })
  owner_name?: string;

  @ApiPropertyOptional({ description: '历史主负责人用户ID', example: 1, type: 'integer' })
  owner_user_id?: number;

  @ApiPropertyOptional({ description: '其他负责人名称', example: '李四、王五', maxLength: 500 })
  cc_names?: string;

  @ApiPropertyOptional({ description: '历史抄送人ID列表', example: [2, 3], isArray: true, type: 'integer' })
  cc_user_ids?: number[];

  @ApiPropertyOptional({ description: '年费/单次费用', example: 1999.0, type: 'number', format: 'decimal' })
  fee?: number;

  @ApiPropertyOptional({ description: '备注', example: '自动续费需提前确认发票', maxLength: 500 })
  notes?: string;

  @ApiPropertyOptional({ description: '状态', example: 'active', enum: ['active', 'inactive'] })
  status?: 'active' | 'inactive';
}

export class RenewSubscriptionDto {
  @ApiPropertyOptional({ description: '续费备注', example: '已完成续费', maxLength: 500 })
  remarks?: string;
}


// 续费记录相关接口
export interface CreateSubscriptionRenewalRecordDto {
  renewal_date?: string;
  next_reminder_date?: string;
  remind_days_before?: number;
  reminder_mode?: 'daily' | 'once';
  fee?: number;
  renewal_method?: string;
  remarks?: string;
  status?: 'active' | 'completed' | 'voided';
}

export interface UpdateSubscriptionRenewalRecordDto {
  renewal_date?: string;
  next_reminder_date?: string;
  remind_days_before?: number;
  reminder_mode?: 'daily' | 'once';
  fee?: number;
  renewal_method?: string;
  remarks?: string;
  status?: 'active' | 'completed' | 'voided';
}

export interface SubscriptionRenewalRecordResponse {
  id: number;
  subscription_id: number;
  kit_id: number;
  renewal_date: string | null;
  next_reminder_date: string | null;
  remind_days_before: number;
  reminder_mode: 'daily' | 'once';
  fee: number | null;
  renewal_method: string | null;
  status: 'active' | 'completed' | 'voided';
  remarks: string | null;
  operated_by: number | null;
  created_at: string;
  updated_at: string;
  operator?: {
    id: number;
    username: string;
  };
}

