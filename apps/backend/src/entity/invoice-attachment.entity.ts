import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';

@Entity('invoice_attachments')
export class InvoiceAttachment {
  @PrimaryGeneratedColumn()
  attachment_id: number;

  @Column()
  invoice_id: number;

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

  @ManyToOne(() => Invoice, invoice => invoice.attachments)
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;
}
