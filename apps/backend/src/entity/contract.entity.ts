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

@Entity('contracts')
export class Contract {
  @PrimaryGeneratedColumn()
  id: number;

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

  @Column({ type: 'text', nullable: true })
  terms: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Customer, customer => customer.contracts)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @OneToMany(() => Invoice, invoice => invoice.contract)
  invoices: Invoice[];
}
