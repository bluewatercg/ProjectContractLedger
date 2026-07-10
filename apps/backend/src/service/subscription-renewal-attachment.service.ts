import { Provide, Config } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionRenewalAttachment } from '../entity/subscription-renewal-attachment.entity';
import { SubscriptionRenewalLog } from '../entity/subscription-renewal-log.entity';
import { SubscriptionRenewalRecord } from '../entity/subscription-renewal-record.entity';
import { CreateAttachmentDto, AttachmentResponse } from '../interface';
import * as fs from 'fs';
import * as path from 'path';

export interface SubscriptionRenewalAttachmentResponse extends AttachmentResponse {
  renewal_log_id: number | null;
  renewal_record_id: number | null;
  subscription_id: number;
  kit_id: number;
  attachment_type: 'contract' | 'invoice';
  uploaded_by: number;
}

@Provide()
export class SubscriptionRenewalAttachmentService {
  @InjectEntityModel(SubscriptionRenewalAttachment)
  attachmentRepository: Repository<SubscriptionRenewalAttachment>;

  @InjectEntityModel(SubscriptionRenewalLog)
  renewalLogRepository: Repository<SubscriptionRenewalLog>;

  @InjectEntityModel(SubscriptionRenewalRecord)
  renewalRecordRepository: Repository<SubscriptionRenewalRecord>;

  @Config('upload')
  uploadConfig: any;

  async createAttachment(
    renewalLogId: number,
    kitId: number,
    attachmentType: 'contract' | 'invoice',
    uploadedBy: number,
    attachmentData: CreateAttachmentDto
  ): Promise<SubscriptionRenewalAttachmentResponse> {
    const log = await this.renewalLogRepository.findOne({
      where: { id: renewalLogId, kit_id: kitId } as any,
    });

    if (!log) {
      throw new Error('续费记录不存在');
    }

    const attachment = this.attachmentRepository.create({
      renewal_log_id: renewalLogId,
      renewal_record_id: null,
      subscription_id: log.subscription_id,
      kit_id: kitId,
      attachment_type: attachmentType,
      uploaded_by: uploadedBy,
      ...attachmentData,
    });

    return this.toResponse(await this.attachmentRepository.save(attachment));
  }

  async createAttachmentByRenewalRecordId(
    renewalRecordId: number,
    kitId: number,
    attachmentType: 'contract' | 'invoice',
    uploadedBy: number,
    attachmentData: CreateAttachmentDto
  ): Promise<SubscriptionRenewalAttachmentResponse> {
    const record = await this.renewalRecordRepository.findOne({
      where: { id: renewalRecordId, kit_id: kitId } as any,
    });

    if (!record) {
      throw new Error('续费记录不存在');
    }

    const attachment = this.attachmentRepository.create({
      renewal_log_id: null,
      renewal_record_id: renewalRecordId,
      subscription_id: record.subscription_id,
      kit_id: kitId,
      attachment_type: attachmentType,
      uploaded_by: uploadedBy,
      ...attachmentData,
    });

    return this.toResponse(await this.attachmentRepository.save(attachment));
  }

  async getAttachmentsByRenewalLogId(
    renewalLogId: number,
    kitId: number
  ): Promise<SubscriptionRenewalAttachmentResponse[]> {
    const attachments = await this.attachmentRepository.find({
      where: { renewal_log_id: renewalLogId, kit_id: kitId } as any,
      order: { uploaded_at: 'DESC' },
    });

    return attachments.map(item => this.toResponse(item));
  }

  async getAttachmentsByRenewalRecordId(
    renewalRecordId: number,
    kitId: number
  ): Promise<SubscriptionRenewalAttachmentResponse[]> {
    const attachments = await this.attachmentRepository.find({
      where: { renewal_record_id: renewalRecordId, kit_id: kitId } as any,
      order: { uploaded_at: 'DESC' },
    });

    return attachments.map(item => this.toResponse(item));
  }

  async getAttachmentsBySubscriptionId(
    subscriptionId: number,
    kitId: number
  ): Promise<SubscriptionRenewalAttachmentResponse[]> {
    const attachments = await this.attachmentRepository.find({
      where: { subscription_id: subscriptionId, kit_id: kitId } as any,
      order: { uploaded_at: 'DESC' },
    });

    return attachments.map(item => this.toResponse(item));
  }

  async getAttachmentById(
    attachmentId: number,
    kitId?: number
  ): Promise<SubscriptionRenewalAttachment | null> {
    const where: any = { attachment_id: attachmentId };
    if (kitId) {
      where.kit_id = kitId;
    }
    return await this.attachmentRepository.findOne({ where });
  }

  async deleteAttachment(attachmentId: number, kitId: number): Promise<boolean> {
    const attachment = await this.getAttachmentById(attachmentId, kitId);
    if (!attachment) {
      return false;
    }

    await this.removeAttachmentFile(attachment);
    await this.attachmentRepository.remove(attachment);
    return true;
  }

  async deleteAttachmentsByRenewalLogId(renewalLogId: number, kitId: number): Promise<void> {
    const attachments = await this.attachmentRepository.find({
      where: { renewal_log_id: renewalLogId, kit_id: kitId } as any,
    });

    for (const attachment of attachments) {
      await this.removeAttachmentFile(attachment);
    }

    if (attachments.length > 0) {
      await this.attachmentRepository.remove(attachments);
    }
  }

  async deleteAttachmentsByRenewalRecordId(renewalRecordId: number, kitId: number): Promise<void> {
    const attachments = await this.attachmentRepository.find({
      where: { renewal_record_id: renewalRecordId, kit_id: kitId } as any,
    });

    for (const attachment of attachments) {
      await this.removeAttachmentFile(attachment);
    }

    if (attachments.length > 0) {
      await this.attachmentRepository.remove(attachments);
    }
  }

  generateFilePath(renewalRefId: number, attachmentType: 'contract' | 'invoice', originalName: string): string {
    const baseUploadDir = this.uploadConfig?.uploadDir || '/app/uploads';
    const uploadDir = path.join(baseUploadDir, 'subscriptions', renewalRefId.toString(), attachmentType);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const timestamp = Date.now();
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    return path.join(uploadDir, `${baseName}_${timestamp}${ext}`);
  }

  validateFileType(fileName: string): boolean {
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    return allowedExtensions.includes(path.extname(fileName).toLowerCase());
  }

  validateFileSize(fileSize: number): boolean {
    return fileSize <= 10 * 1024 * 1024;
  }

  private async removeAttachmentFile(attachment: SubscriptionRenewalAttachment): Promise<void> {
    try {
      if (fs.existsSync(attachment.file_path)) {
        fs.unlinkSync(attachment.file_path);
      }
    } catch (error) {
      console.error('删除订阅续费附件失败:', error);
    }
  }

  private toResponse(attachment: SubscriptionRenewalAttachment): SubscriptionRenewalAttachmentResponse {
    return {
      attachment_id: attachment.attachment_id,
      renewal_log_id: attachment.renewal_log_id,
      renewal_record_id: attachment.renewal_record_id,
      subscription_id: attachment.subscription_id,
      kit_id: attachment.kit_id,
      attachment_type: attachment.attachment_type,
      file_name: attachment.file_name,
      file_path: attachment.file_path,
      file_type: attachment.file_type,
      file_size: attachment.file_size,
      uploaded_by: attachment.uploaded_by,
      uploaded_at: attachment.uploaded_at,
    };
  }
}
