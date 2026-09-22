import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';
import { Customer } from './customer.entity';
import { Kit } from './kit.entity';

@Entity('invoice_payment_allocations')
export class InvoicePaymentAllocation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  kit_id: number;

  @Column()
  invoice_id: number;

  @Column()
  payer_customer_id: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  allocated_amount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  allocated_ratio: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Kit)
  @JoinColumn({ name: 'kit_id' })
  kit: Kit;

  @ManyToOne(() => Invoice)
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'payer_customer_id' })
  payer_customer: Customer;
}
