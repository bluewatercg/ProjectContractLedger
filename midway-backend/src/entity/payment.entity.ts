import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Invoice } from './invoice.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  invoice_id: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({
    type: 'datetime',
    nullable: true
   })
  payment_date: Date;

  @Column({ 
    type: 'enum', 
    enum: ['cash', 'bank_transfer', 'check', 'credit_card', 'other'], 
    default: 'bank_transfer' 
  })
  payment_method: string;

  @Column({ length: 100, nullable: true })
  reference_number: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ 
    type: 'enum', 
    enum: ['pending', 'completed', 'failed'], 
    default: 'completed' 
  })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Invoice, invoice => invoice.payments)
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;
}
