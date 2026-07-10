import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Kit } from './kit.entity';
import { User } from './user.entity';
import { SubscriptionRecord } from './subscription-record.entity';
import { SubscriptionRenewalAttachment } from './subscription-renewal-attachment.entity';

@Entity('subscription_renewal_records')
export class SubscriptionRenewalRecord {
  @PrimaryGeneratedColumn({ comment: '主键ID' })
  id: number;

  @Column({ name: 'subscription_id', comment: '关联订阅事项ID' })
  subscription_id: number;

  @Column({ name: 'kit_id', comment: '套账ID' })
  kit_id: number;

  @Column({ name: 'renewal_date', type: 'date', nullable: true, comment: '续费日期' })
  renewal_date: Date | null;

  @Column({ name: 'next_reminder_date', type: 'date', nullable: true, comment: '下次提醒时间（开始提醒日期）' })
  next_reminder_date: Date | null;

  @Column({ name: 'remind_days_before', type: 'int', default: 0, comment: '提前几天提醒（业务说明字段）' })
  remind_days_before: number;

  @Column({
    name: 'reminder_mode',
    type: 'enum',
    enum: ['daily', 'once'],
    default: 'daily',
    comment: '提醒方式：daily-每日提醒，once-只提醒一次',
  })
  reminder_mode: 'daily' | 'once';

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '费用' })
  fee: number | null;

  @Column({ name: 'renewal_method', length: 500, nullable: true, comment: '续费方式' })
  renewal_method: string | null;

  @Column({
    type: 'enum',
    enum: ['active', 'completed', 'voided'],
    default: 'active',
    comment: '状态：active-生效中，completed-已完成，voided-已作废',
  })
  status: 'active' | 'completed' | 'voided';

  @Column({ type: 'text', nullable: true, comment: '备注' })
  remarks: string | null;

  @Column({ name: 'operated_by', nullable: true, comment: '操作人ID' })
  operated_by: number | null;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updated_at: Date;

  @ManyToOne(() => SubscriptionRecord)
  @JoinColumn({ name: 'subscription_id' })
  subscription: SubscriptionRecord;

  @ManyToOne(() => Kit)
  @JoinColumn({ name: 'kit_id' })
  kit: Kit;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'operated_by' })
  operator: User | null;

  @OneToMany(() => SubscriptionRenewalAttachment, attachment => attachment.renewalRecord)
  attachments: SubscriptionRenewalAttachment[];
}