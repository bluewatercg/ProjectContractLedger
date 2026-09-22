import { Provide, Config } from '@midwayjs/core';
import { InjectEntityModel, InjectDataSource } from '@midwayjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InvoiceAttachment } from '../entity/invoice-attachment.entity';
import { Invoice } from '../entity/invoice.entity';
import { CreateAttachmentDto, AttachmentResponse } from '../interface';
import * as fs from 'fs';
import * as path from 'path';

@Provide()
export class InvoiceAttachmentService {
  @InjectEntityModel(InvoiceAttachment)
  invoiceAttachmentRepository: Repository<InvoiceAttachment>;

  @InjectEntityModel(Invoice)
  invoiceRepository: Repository<Invoice>;

  @Config('upload')
  uploadConfig: any;

  @InjectDataSource()
  dataSource: DataSource;

  /**
   * 创建发票附件记录
   */
  async createAttachment(
    invoiceId: number,
    attachmentData: CreateAttachmentDto,
    kitId: number
  ): Promise<AttachmentResponse> {
    if (!kitId) throw new Error('请登录并选择当前套账');
    return await this.dataSource.transaction(async manager => {
      const invoice = await manager.findOne(Invoice, {
        where: { id: invoiceId, kit_id: kitId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!invoice) throw new Error('发票不存在');
      if (invoice.status === 'cancelled')
        throw new Error('已作废发票不可上传附件');
      const attachment = manager.create(InvoiceAttachment, {
        invoice_id: invoiceId,
        ...attachmentData,
      });
      const saved = await manager.save(InvoiceAttachment, attachment);
      return {
        attachment_id: saved.attachment_id,
        file_name: saved.file_name,
        file_path: saved.file_path,
        file_type: saved.file_type,
        file_size: saved.file_size,
        uploaded_at: saved.uploaded_at,
      };
    });
  }

  /**
   * 获取发票的所有附件
   */
  async getAttachmentsByInvoiceId(
    invoiceId: number
  ): Promise<AttachmentResponse[]> {
    const attachments = await this.invoiceAttachmentRepository.find({
      where: { invoice_id: invoiceId },
      order: { uploaded_at: 'DESC' },
    });
    return attachments.map(attachment => ({
      attachment_id: attachment.attachment_id,
      file_name: attachment.file_name,
      file_path: attachment.file_path,
      file_type: attachment.file_type,
      file_size: attachment.file_size,
      uploaded_at: attachment.uploaded_at,
    }));
  }

  /**
   * 根据ID获取附件
   */
  async getAttachmentById(
    attachmentId: number
  ): Promise<InvoiceAttachment | null> {
    return await this.invoiceAttachmentRepository.findOne({
      where: { attachment_id: attachmentId },
    });
  }

  /**
   * 删除附件
   */
  async deleteAttachment(
    attachmentId: number,
    kitId: number
  ): Promise<{ deleted: boolean; filePath: string | null }> {
    if (!kitId) throw new Error('请登录并选择当前套账');
    return await this.dataSource.transaction(async manager => {
      const attachment = await manager.findOne(InvoiceAttachment, {
        where: { attachment_id: attachmentId },
      });
      if (!attachment) return { deleted: false, filePath: null };
      const invoice = await manager.findOne(Invoice, {
        where: { id: attachment.invoice_id, kit_id: kitId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!invoice) throw new Error('发票不存在');
      if (invoice.status === 'cancelled')
        throw new Error('已作废发票不可删除附件');
      await manager.remove(InvoiceAttachment, attachment);
      return { deleted: true, filePath: attachment.file_path };
    });
  }

  /**
   * 生成文件存储路径
   */
  generateFilePath(invoiceId: number, originalName: string): string {
    // 使用配置中的上传目录，确保在Docker容器中路径正确
    const baseUploadDir = this.uploadConfig?.uploadDir || '/app/uploads';
    const uploadDir = path.join(
      baseUploadDir,
      'invoices',
      invoiceId.toString()
    );

    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const fileName = `${baseName}_${timestamp}${ext}`;

    return path.join(uploadDir, fileName);
  }

  /**
   * 验证文件类型
   */
  validateFileType(fileName: string): boolean {
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(fileName).toLowerCase();
    return allowedExtensions.includes(ext);
  }

  /**
   * 验证文件大小
   */
  validateFileSize(fileSize: number): boolean {
    const maxSize = 10 * 1024 * 1024; // 10MB
    return fileSize <= maxSize;
  }
}
