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
import { Contract } from './contract.entity';

@Entity('contract_relations')
export class ContractRelation {
  @PrimaryGeneratedColumn({ comment: '主键ID' })
  id: number;

  @Column({ name: 'kit_id', comment: '套账ID' })
  kit_id: number;

  @Column({ name: 'source_contract_id', comment: '源合同ID' })
  source_contract_id: number;

  @Column({ name: 'target_contract_id', comment: '目标合同ID' })
  target_contract_id: number;

  @Column({
    name: 'relation_type',
    type: 'enum',
    enum: ['main_operation', 'main_supplement', 'renewal', 'replacement', 'related'],
    comment: '关系类型：main_operation-主合同与运维合同，main_supplement-主合同与补充协议，renewal-续签，replacement-换签，related-关联合同',
  })
  relation_type: 'main_operation' | 'main_supplement' | 'renewal' | 'replacement' | 'related';

  @Column({ type: 'text', nullable: true, comment: '备注' })
  remarks: string | null;

  @Column({ name: 'created_by', nullable: true, comment: '创建人ID' })
  created_by: number | null;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updated_at: Date;

  @ManyToOne(() => Kit)
  @JoinColumn({ name: 'kit_id' })
  kit: Kit;

  @ManyToOne(() => Contract)
  @JoinColumn({ name: 'source_contract_id' })
  sourceContract: Contract;

  @ManyToOne(() => Contract)
  @JoinColumn({ name: 'target_contract_id' })
  targetContract: Contract;
}
