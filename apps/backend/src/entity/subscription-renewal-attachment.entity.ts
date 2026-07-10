import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SubscriptionRenewalLog } from './subscription-renewal-log.entity';
import { SubscriptionRenewalRecord } from './subscription-renewal-record.entity';

@Entity('subscription_renewal_attachments')
export class SubscriptionRenewalAttachment {
  @PrimaryGeneratedColumn()
  attachment_id: number;

  @Column({ nullable: true })
  renewal_log_id: number | null;

  @Column()
  subscription_id: number;

  @Column()
  kit_id: number;

  @Column({ nullable: true })
  renewal_record_id: number | null;

  @Column({ type: 'enum', enum: ['contract', 'invoice'] })
  attachment_type: 'contract' | 'invoice';

  @Column({ length: 255 })
  file_name: string;

  @Column({ length: 255 })
  file_path: string;

  @Column({ length: 50, nullable: true })
  file_type: string;

  @Column({ type: 'int', nullable: true })
  file_size: number;

  @Column({ nullable: true })
  uploaded_by: number;

  @CreateDateColumn()
  uploaded_at: Date;

  @ManyToOne(() => SubscriptionRenewalLog, log => log.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'renewal_log_id' })
  renewalLog: SubscriptionRenewalLog;

  @ManyToOne(() => SubscriptionRenewalRecord, record => record.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'renewal_record_id' })
  renewalRecord: SubscriptionRenewalRecord;
}