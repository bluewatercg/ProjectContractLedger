import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Kit } from './kit.entity';
import { SubscriptionRecord } from './subscription-record.entity';

@Entity('subscription_push_logs')
export class SubscriptionPushLog {
  @PrimaryGeneratedColumn({ comment: '主键ID' })
  id: number;

  @Column({ name: 'subscription_id', comment: '订阅ID' })
  subscription_id: number;

  @Column({ name: 'kit_id', comment: '套账ID' })
  kit_id: number;

  @Column({ name: 'push_date', type: 'date', comment: '推送日期' })
  push_date: Date;

  @Column({
    name: 'push_type',
    type: 'enum',
    enum: ['reminder', 'overdue'],
    comment: '推送类型：reminder-到期提醒，overdue-逾期提醒',
  })
  push_type: 'reminder' | 'overdue';

  @Column({ name: 'days_until_expiry', type: 'int', nullable: true, comment: '距到期天数，逾期为负数' })
  days_until_expiry: number | null;

  @Column({ name: 'pushed_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP', comment: '推送时间' })
  pushed_at: Date;

  @ManyToOne(() => SubscriptionRecord, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscription_id' })
  subscription: SubscriptionRecord;

  @ManyToOne(() => Kit)
  @JoinColumn({ name: 'kit_id' })
  kit: Kit;
}
