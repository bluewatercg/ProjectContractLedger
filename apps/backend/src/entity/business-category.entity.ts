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
import { User } from './user.entity';

/**
 * 业务类型实体
 * 支持N级树形结构，使用邻接表模式（Adjacency List）实现自引用关系
 */
@Entity('business_categories')
export class BusinessCategory {
  @PrimaryGeneratedColumn({ comment: '主键ID' })
  id: number;

  @Column({ name: 'kit_id', comment: '套账ID' })
  kit_id: number;

  @Column({ name: 'parent_id', nullable: true, comment: '父分类ID，NULL表示根节点' })
  parent_id: number | null;

  @Column({ length: 100, comment: '分类名称' })
  name: string;

  @Column({ type: 'int', default: 0, comment: '同级排序序号' })
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

  // ==================== 关联关系 ====================

  /**
   * 自引用关系 - 父分类
   * 多对一：多个子分类对应一个父分类
   */
  @ManyToOne(() => BusinessCategory, category => category.children, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'parent_id' })
  parent: BusinessCategory;

  /**
   * 自引用关系 - 子分类列表
   * 一对多：一个父分类对应多个子分类
   */
  @OneToMany(() => BusinessCategory, category => category.parent)
  children: BusinessCategory[];

  /**
   * 所属套账
   */
  @ManyToOne(() => Kit)
  @JoinColumn({ name: 'kit_id' })
  kit: Kit;

  /**
   * 创建人
   */
  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;
}
