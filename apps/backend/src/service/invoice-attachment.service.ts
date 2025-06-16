import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
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

  /**
   * 创建发票附件记录
   */
  async createAttachment(
    invoiceId: number,
    attachmentData: CreateAttachmentDto
  ): Promise<AttachmentResponse> {
    // 验证发票是否存在
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new Error('发票不存在');
    }

    const attachment = this.invoiceAttachmentRepository.create({
      invoice_id: invoiceId,
      ...attachmentData,
    });

    const savedAttachment = await this.invoiceAttachmentRepository.save(
      attachment
    );

    return {
      attachment_id: savedAttachment.attachment_id,
      file_name: savedAttachment.file_name,
      file_path: savedAttachment.file_path,
      file_type: savedAttachment.file_type,
      file_size: savedAttachment.file_size,
      uploaded_at: savedAttachment.uploaded_at,
    };
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
  async deleteAttachment(attachmentId: number): Promise<boolean> {
    const attachment = await this.invoiceAttachmentRepository.findOne({
      where: { attachment_id: attachmentId },
    });

    if (!attachment) {
      return false;
    }

    // 删除物理文件
    try {
      if (fs.existsSync(attachment.file_path)) {
        fs.unlinkSync(attachment.file_path);
      }
    } catch (error) {
      console.error('删除文件失败:', error);
    }

    // 删除数据库记录
    await this.invoiceAttachmentRepository.remove(attachment);
    return true;
  }

  /**
   * 生成文件存储路径
   */
  generateFilePath(invoiceId: number, originalName: string): string {
    const uploadDir = path.join(
      process.cwd(),
      'uploads',
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
