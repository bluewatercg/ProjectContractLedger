import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Kit } from './kit.entity';
import { User } from './user.entity';

@Entity('subscription_types')
export class SubscriptionType {
  @PrimaryGeneratedColumn({ comment: '主键ID' })
  id: number;

  @Column({ name: 'kit_id', comment: '套账ID' })
  kit_id: number;

  @Column({ length: 50, comment: '事项类型名称' })
  name: string;

  @Column({ length: 50, comment: '事项类型编码，套账内唯一' })
  code: string;

  @Column({ type: 'boolean', default: false, comment: '是否为系统预置类型' })
  is_default: boolean;

  @Column({ type: 'int', default: 0, comment: '排序序号' })
  sort_order: number;

  @Column({
    type: 'enum',
    enum: ['active', 'disabled'],
    default: 'active',
    comment: '状态：active-启用，disabled-禁用',
  })
  status: 'active' | 'disabled';

  @Column({ name: 'created_by', comment: '创建人ID' })
  created_by: number;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updated_at: Date;

  @ManyToOne(() => Kit)
  @JoinColumn({ name: 'kit_id' })
  kit: Kit;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;
}
