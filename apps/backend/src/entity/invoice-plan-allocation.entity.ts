import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Kit } from './kit.entity';
import { ContractInvoicePlan } from './contract-invoice-plan.entity';
import { Invoice } from './invoice.entity';

/**
 * 发票与开票计划的分摊关联
 *
 * 一张发票可以拆分到多个开票计划（一票拆多期），
 * 每条记录显式记录该期计入的金额，而不是按比例推算，
 * 避免计划金额变动后历史分摊被改写。
 */
@Entity('invoice_plan_allocations')
@Unique('uk_allocation_invoice_plan', ['invoice_id', 'plan_id'])
export class InvoicePlanAllocation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  kit_id: number;

  @Column()
  @Index('idx_alloc_invoice_id')
  invoice_id: number;

  @Column()
  @Index('idx_alloc_plan_id')
  plan_id: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    comment: '计入该计划的开票金额',
  })
  allocated_amount: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Kit)
  @JoinColumn({ name: 'kit_id' })
  kit: Kit;

  @ManyToOne(() => Invoice, invoice => invoice.plan_allocations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @ManyToOne(() => ContractInvoicePlan, plan => plan.allocations, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'plan_id' })
  plan: ContractInvoicePlan;
}
