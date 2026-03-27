import { ApiProperty, ApiPropertyOptional } from '@midwayjs/swagger';

export class CreateContractInvoicePlanDto {
  @ApiPropertyOptional({
    description: '计划ID（存在则更新，不存在则创建）',
    example: 1,
    type: 'integer',
  })
  id?: number;

  @ApiProperty({
    description: '期数名称，如首付款、第二期',
    example: '首付款',
    maxLength: 100,
  })
  phase_name: string;

  @ApiPropertyOptional({
    description: '支付比例（0-1 之间的小数）',
    example: 0.3,
    type: 'number',
    format: 'decimal',
  })
  pay_ratio?: number;

  @ApiProperty({
    description: '计划开票金额',
    example: 30000.0,
    type: 'number',
    format: 'decimal',
  })
  planned_amount: number;

  @ApiPropertyOptional({
    description: '预计开票日期',
    example: '2024-06-30',
    format: 'date',
  })
  planned_invoice_date?: string;

  @ApiPropertyOptional({
    description: '提前提醒天数',
    example: 7,
    type: 'integer',
    default: 0,
  })
  remind_days_before?: number;
}

export class UpdateContractInvoicePlanDto {
  @ApiPropertyOptional({
    description: '期数名称，如首付款、第二期',
    example: '首付款',
    maxLength: 100,
  })
  phase_name?: string;

  @ApiPropertyOptional({
    description: '支付比例（0-1 之间的小数）',
    example: 0.3,
    type: 'number',
    format: 'decimal',
  })
  pay_ratio?: number;

  @ApiPropertyOptional({
    description: '计划开票金额',
    example: 30000.0,
    type: 'number',
    format: 'decimal',
  })
  planned_amount?: number;

  @ApiPropertyOptional({
    description: '预计开票日期',
    example: '2024-06-30',
    format: 'date',
  })
  planned_invoice_date?: string;

  @ApiPropertyOptional({
    description: '提前提醒天数',
    example: 7,
    type: 'integer',
  })
  remind_days_before?: number;
}

export class BatchSaveContractInvoicePlanDto {
  @ApiProperty({
    description: '合同下的开票计划列表',
    type: [CreateContractInvoicePlanDto],
  })
  plans: CreateContractInvoicePlanDto[];
}
