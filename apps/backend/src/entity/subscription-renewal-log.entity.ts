import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Kit } from './kit.entity';
import { User } from './user.entity';
import { SubscriptionRenewalAttachment } from './subscription-renewal-attachment.entity';
import { SubscriptionRecord } from './subscription-record.entity';

@Entity('subscription_renewal_logs')
export class SubscriptionRenewalLog {
  @PrimaryGeneratedColumn({ comment: '主键ID' })
  id: number;

  @Column({ name: 'subscription_id', comment: '订阅ID' })
  subscription_id: number;

  @Column({ name: 'kit_id', comment: '套账ID' })
  kit_id: number;

  @Column({ name: 'previous_expiry_date', type: 'date', comment: '上一到期日' })
  previous_expiry_date: Date;

  @Column({ name: 'new_expiry_date', type: 'date', comment: '新到期日' })
  new_expiry_date: Date;

  @Column({ name: 'renewal_period_value', type: 'int', comment: '续费周期数值' })
  renewal_period_value: number;

  @Column({
    name: 'renewal_period_unit',
    type: 'enum',
    enum: ['day', 'month', 'year'],
    comment: '续费周期单位',
  })
  renewal_period_unit: 'day' | 'month' | 'year';

  @Column({ name: 'operated_by', comment: '操作人ID' })
  operated_by: number;

  @Column({ name: 'operated_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP', comment: '操作时间' })
  operated_at: Date;

  @Column({ length: 500, nullable: true, comment: '备注' })
  remarks: string | null;

  @ManyToOne(() => SubscriptionRecord, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscription_id' })
  subscription: SubscriptionRecord;

  @ManyToOne(() => Kit)
  @JoinColumn({ name: 'kit_id' })
  kit: Kit;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'operated_by' })
  operator: User;

  @OneToMany(() => SubscriptionRenewalAttachment, attachment => attachment.renewalLog)
  attachments: SubscriptionRenewalAttachment[];
}
