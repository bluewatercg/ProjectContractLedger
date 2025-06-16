import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Contract } from './contract.entity';

@Entity('contract_attachments')
export class ContractAttachment {
  @PrimaryGeneratedColumn()
  attachment_id: number;

  @Column()
  contract_id: number;

  @Column({ length: 255 })
  file_name: string;

  @Column({ length: 255 })
  file_path: string;

  @Column({ length: 50, nullable: true })
  file_type: string;

  @Column({ type: 'int', nullable: true })
  file_size: number;

  @CreateDateColumn()
  uploaded_at: Date;

  @ManyToOne(() => Contract, contract => contract.attachments)
  @JoinColumn({ name: 'contract_id' })
  contract: Contract;
}
