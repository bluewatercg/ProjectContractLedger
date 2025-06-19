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
    description: '客户状态',
    example: 'active',
    enum: ['active', 'inactive', 'suspended'],
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
