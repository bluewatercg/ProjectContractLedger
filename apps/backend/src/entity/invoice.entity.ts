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
import { Contract } from './contract.entity';
import { Payment } from './payment.entity';
import { InvoiceAttachment } from './invoice-attachment.entity';
import { Kit } from './kit.entity';
import { ContractInvoicePlan } from './contract-invoice-plan.entity';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  kit_id: number;

  @Column({ length: 50, unique: true })
  invoice_number: string;

  @Column()
  contract_id: number;

  @Column({ type: 'int', nullable: true })
  plan_id: number | null;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  tax_rate: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  tax_amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  total_amount: number;

  @Column({ type: 'datetime', nullable: true })
  issue_date: Date;

  @Column({ type: 'datetime', nullable: true })
  due_date: Date;

  @Column({
    type: 'enum',
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled', 'bad_debt'],
    default: 'sent',
  })
  status: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    comment: '坏账金额',
  })
  bad_debt_amount: number;

  @Column({ type: 'text', nullable: true, comment: '坏账原因' })
  bad_debt_reason: string | null;

  @Column({ type: 'int', nullable: true, comment: '坏账处理人' })
  bad_debt_handler: number | null;

  @Column({ type: 'datetime', nullable: true, comment: '坏账标记时间' })
  bad_debt_marked_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Kit)
  @JoinColumn({ name: 'kit_id' })
  kit: Kit;

  @ManyToOne(() => Contract, contract => contract.invoices)
  @JoinColumn({ name: 'contract_id' })
  contract: Contract;

  @ManyToOne(() => ContractInvoicePlan, plan => plan.invoices, { nullable: true })
  @JoinColumn({ name: 'plan_id' })
  plan?: ContractInvoicePlan;

  @OneToMany(() => Payment, payment => payment.invoice)
  payments: Payment[];

  @OneToMany(() => InvoiceAttachment, attachment => attachment.invoice)
  attachments: InvoiceAttachment[];
}

