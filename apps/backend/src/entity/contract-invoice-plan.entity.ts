import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Kit } from './kit.entity';
import { Contract } from './contract.entity';
import { Invoice } from './invoice.entity';

export type ContractInvoicePlanStatus =
  | 'pending'
  | 'partial_invoiced'
  | 'invoiced'
  | 'cancelled';

@Entity('contract_invoice_plan')
export class ContractInvoicePlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  kit_id: number;

  @Column()
  contract_id: number;

  @Column({ length: 100 })
  phase_name: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 4,
    default: 0,
    comment: '支付比例，0-1 之间',
  })
  pay_ratio: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    comment: '计划开票金额',
  })
  planned_amount: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    comment: '实际已开票金额汇总',
  })
  actual_invoiced_amount: number;

  @Column({ type: 'date', nullable: true, comment: '预计开票日期' })
  planned_invoice_date: string | null;

  @Column({ type: 'int', default: 0, comment: '提前提醒天数' })
  remind_days_before: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'partial_invoiced', 'invoiced', 'cancelled'],
    default: 'pending',
    comment: '计划状态',
  })
  status: ContractInvoicePlanStatus;

  @Column({ type: 'datetime', nullable: true, comment: '首次提醒时间' })
  first_reminded_at: Date | null;

  @Column({ type: 'datetime', nullable: true, comment: '最近提醒时间' })
  last_reminded_at: Date | null;

  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updated_at: Date;

  @ManyToOne(() => Kit)
  @JoinColumn({ name: 'kit_id' })
  kit: Kit;

  @ManyToOne(() => Contract, contract => contract.invoice_plans)
  @JoinColumn({ name: 'contract_id' })
  contract: Contract;

  @OneToMany(() => Invoice, invoice => invoice.plan)
  invoices: Invoice[];
}
