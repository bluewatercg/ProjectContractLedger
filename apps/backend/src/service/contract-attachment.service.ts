import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { ContractAttachment } from '../entity/contract-attachment.entity';
import { Contract } from '../entity/contract.entity';
import { CreateAttachmentDto, AttachmentResponse } from '../interface';
import * as fs from 'fs';
import * as path from 'path';
import { Config } from '@midwayjs/core';

@Provide()
export class ContractAttachmentService {
  @InjectEntityModel(ContractAttachment)
  contractAttachmentRepository: Repository<ContractAttachment>;

  @InjectEntityModel(Contract)
  contractRepository: Repository<Contract>;

  @Config('upload')
  uploadConfig: any;

  /**
   * 创建合同附件记录
   */
  async createAttachment(
    contractId: number,
    attachmentData: CreateAttachmentDto
  ): Promise<AttachmentResponse> {
    // 验证合同是否存在
    const contract = await this.contractRepository.findOne({
      where: { id: contractId },
    });

    if (!contract) {
      throw new Error('合同不存在');
    }

    const attachment = this.contractAttachmentRepository.create({
      contract_id: contractId,
      ...attachmentData,
    });

    const savedAttachment = await this.contractAttachmentRepository.save(
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
   * 获取合同的所有附件
   */
  async getAttachmentsByContractId(
    contractId: number
  ): Promise<AttachmentResponse[]> {
    const attachments = await this.contractAttachmentRepository.find({
      where: { contract_id: contractId },
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
  ): Promise<ContractAttachment | null> {
    return await this.contractAttachmentRepository.findOne({
      where: { attachment_id: attachmentId },
    });
  }

  /**
   * 删除附件
   */
  async deleteAttachment(attachmentId: number): Promise<boolean> {
    const attachment = await this.contractAttachmentRepository.findOne({
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
    await this.contractAttachmentRepository.remove(attachment);
    return true;
  }

  /**
   * 生成文件存储路径
   */
  generateFilePath(contractId: number, originalName: string): string {
    // 使用配置中的上传目录，确保在Docker容器中路径正确
    const baseUploadDir = this.uploadConfig?.uploadDir || '/app/uploads';
    const uploadDir = path.join(
      baseUploadDir,
      'contracts',
      contractId.toString()
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
