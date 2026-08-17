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
import { SubscriptionType } from './subscription-type.entity';
import { SubscriptionRenewalRecord } from './subscription-renewal-record.entity';

@Entity('subscription_records')
export class SubscriptionRecord {
  @PrimaryGeneratedColumn({ comment: '主键ID' })
  id: number;

  @Column({ name: 'active_renewal_record_id', nullable: true, comment: '当前活跃续费记录ID' })
  active_renewal_record_id: number | null;

  @Column({ name: 'kit_id', comment: '套账ID' })
  kit_id: number;

  @Column({ name: 'type_id', comment: '事项类型ID' })
  type_id: number;

  @Column({ length: 200, comment: '事项名称' })
  name: string;

  @Column({ length: 200, comment: '主体：账号/域名/公司名' })
  subject: string;

  @Column({ length: 100, nullable: true, comment: '供应商/服务商' })
  provider: string | null;

  @Column({ name: 'renewal_url', length: 500, nullable: true, comment: '续费入口或方式' })
  renewal_url: string | null;

  @Column({ name: 'current_expiry_date', type: 'date', nullable: true, comment: '当前到期日' })
  current_expiry_date: Date | null;

  @Column({ name: 'next_reminder_start_date', type: 'date', nullable: true, comment: '下次提醒开始日' })
  next_reminder_start_date: Date | null;

  @Column({ name: 'renewal_period_value', type: 'int', nullable: true, comment: '续费周期数值' })
  renewal_period_value: number | null;

  @Column({
    name: 'renewal_period_unit',
    type: 'enum',
    enum: ['day', 'month', 'year'],
    nullable: true,
    comment: '续费周期单位',
  })
  renewal_period_unit: 'day' | 'month' | 'year' | null;

  @Column({ name: 'remind_days_before', type: 'int', default: 30, comment: '提前提醒天数' })
  remind_days_before: number;

  @Column({
    name: 'reminder_mode',
    type: 'enum',
    enum: ['once', 'daily'],
    default: 'daily',
    comment: '提醒方式',
  })
  reminder_mode: 'once' | 'daily';

  @Column({ name: 'owner_name', length: 100, nullable: true, comment: '主负责人名称（非系统用户）' })
  owner_name: string | null;

  @Column({ name: 'owner_user_id', nullable: true, comment: '历史主负责人用户ID，可为空' })
  owner_user_id: number | null;

  @Column({ name: 'cc_user_ids', length: 500, nullable: true, comment: '历史抄送人ID列表，逗号分隔' })
  cc_user_ids: string | null;

  @Column({ name: 'cc_names', length: 500, nullable: true, comment: '其他负责人名称，手工输入' })
  cc_names: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, comment: '年费/单次费用' })
  fee: number | null;

  @Column({ type: 'text', nullable: true, comment: '备注' })
  notes: string | null;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive'],
    default: 'active',
    comment: '状态：active-启用，inactive-停用',
  })
  status: 'active' | 'inactive';

  @Column({ name: 'created_by', comment: '创建人ID' })
  created_by: number;

  @Column({ name: 'updated_by', nullable: true, comment: '最后更新人ID' })
  updated_by: number | null;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updated_at: Date;

  @ManyToOne(() => Kit)
  @JoinColumn({ name: 'kit_id' })
  kit: Kit;

  @ManyToOne(() => SubscriptionType)
  @JoinColumn({ name: 'type_id' })
  type: SubscriptionType;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'owner_user_id' })
  owner: User | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updated_by' })
  updater: User;

  @OneToMany(() => SubscriptionRenewalRecord, record => record.subscription)
  renewalRecords: SubscriptionRenewalRecord[];

  @ManyToOne(() => SubscriptionRenewalRecord)
  @JoinColumn({ name: 'active_renewal_record_id', referencedColumnName: 'id' })
  activeRenewalRecord: SubscriptionRenewalRecord;
}