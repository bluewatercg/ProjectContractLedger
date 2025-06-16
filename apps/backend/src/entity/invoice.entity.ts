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

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  invoice_number: string;

  @Column()
  contract_id: number;

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

  @Column({
    type: 'enum',
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'sent',
  })
  status: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Contract, contract => contract.invoices)
  @JoinColumn({ name: 'contract_id' })
  contract: Contract;

  @OneToMany(() => Payment, payment => payment.invoice)
  payments: Payment[];
}
