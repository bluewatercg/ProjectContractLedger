import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Reconciliation } from './reconciliation.entity';
import { Payment } from './payment.entity';

@Entity('reconciliation_details')
export class ReconciliationDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  reconciliation_id: number;

  @Column()
  payment_id: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  payment_amount: number;

  @Column({ type: 'datetime' })
  payment_date: Date;

  @Column({ length: 50 })
  payment_method: string;

  @Column({ length: 100, nullable: true })
  reference_number: string;

  @Column({ type: 'boolean', default: true })
  is_matched: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Reconciliation, reconciliation => reconciliation.details)
  @JoinColumn({ name: 'reconciliation_id' })
  reconciliation: Reconciliation;

  @ManyToOne(() => Payment)
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;
}
