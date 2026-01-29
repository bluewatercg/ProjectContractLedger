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
import { Invoice } from './invoice.entity';
import { User } from './user.entity';
import { ReconciliationDetail } from './reconciliation-detail.entity';

@Entity('reconciliations')
export class Reconciliation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  kit_id: number;

  @Column({ length: 50, unique: true })
  reconciliation_number: string;

  @Column()
  invoice_id: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  invoice_amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  paid_amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  difference_amount: number;

  @Column({
    type: 'enum',
    enum: ['matched', 'partial', 'overpaid', 'underpaid', 'unmatched'],
    default: 'unmatched',
  })
  status: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  approval_status: string;

  @Column({ type: 'text', nullable: true })
  difference_reason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  reconciled_by: number;

  @Column({ type: 'datetime', nullable: true })
  reconciled_at: Date;

  @Column({ nullable: true })
  approved_by: number;

  @Column({ type: 'datetime', nullable: true })
  approved_at: Date;

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

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reconciled_by' })
  reconciledByUser: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approved_by' })
  approvedByUser: User;

  @OneToMany(() => ReconciliationDetail, detail => detail.reconciliation)
  details: ReconciliationDetail[];
}
