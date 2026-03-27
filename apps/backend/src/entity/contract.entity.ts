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
import { Customer } from './customer.entity';
import { Invoice } from './invoice.entity';
import { ContractAttachment } from './contract-attachment.entity';
import { Kit } from './kit.entity';
import { ContractInvoicePlan } from './contract-invoice-plan.entity';

@Entity('contracts')
export class Contract {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  kit_id: number;

  @Column({ length: 50, unique: true })
  contract_number: string;

  @Column()
  customer_id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  total_amount: number;

  @Column({ type: 'datetime', nullable: true })
  start_date: Date;

  @Column({ type: 'datetime', nullable: true })
  end_date: Date;

  @Column({
    type: 'enum',
    enum: ['draft', 'active', 'completed', 'cancelled'],
    default: 'draft',
  })
  status: string;

  @Column({
    type: 'boolean',
    default: false,
    comment: '是否续签合同：true-需要续签，false-不需要续签',
  })
  is_renewable: boolean;

  @Column({
    type: 'enum',
    enum: ['5', '30', '60'],
    nullable: true,
    default: '30',
    comment: '续签提醒天数：5天、30天、60天（仅在is_renewable=true时有效）',
  })
  renewal_reminder_days: string;

  @Column({ type: 'text', nullable: true })
  terms: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column()
  created_by: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Kit)
  @JoinColumn({ name: 'kit_id' })
  kit: Kit;

  @ManyToOne(() => Customer, customer => customer.contracts)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @OneToMany(() => Invoice, invoice => invoice.contract)
  invoices: Invoice[];

  @OneToMany(() => ContractInvoicePlan, plan => plan.contract)
  invoice_plans: ContractInvoicePlan[];

  @OneToMany(() => ContractAttachment, attachment => attachment.contract)
  attachments: ContractAttachment[];
}

