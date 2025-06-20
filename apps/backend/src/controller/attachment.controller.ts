import {
  Controller,
  Post,
  Get,
  Del,
  Param,
  Files,
  Inject,
  Query,
} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { UploadFileInfo } from '@midwayjs/upload';
import { ContractAttachmentService } from '../service/contract-attachment.service';
import { InvoiceAttachmentService } from '../service/invoice-attachment.service';
import { ApiResponse } from '../interface';
import * as fs from 'fs';
import * as path from 'path';

@Controller('/api/v1')
export class AttachmentController {
  @Inject()
  contractAttachmentService: ContractAttachmentService;

  @Inject()
  invoiceAttachmentService: InvoiceAttachmentService;

  @Inject()
  ctx: Context;

  /**
   * 上传合同附件
   */
  @Post('/contracts/:contractId/attachments')
  async uploadContractAttachment(
    @Param('contractId') contractId: number,
    @Files() files: UploadFileInfo<string>[]
  ): Promise<ApiResponse> {
    try {
      if (!files || files.length === 0) {
        return {
          success: false,
          message: '请选择要上传的文件',
          code: 400,
        };
      }

      const file = files[0];

      // 验证文件类型
      if (!this.contractAttachmentService.validateFileType(file.filename)) {
        return {
          success: false,
          message: '不支持的文件类型，仅支持 PDF、JPG、JPEG、PNG 格式',
          code: 400,
        };
      }

      // 验证文件大小
      const fileSize = fs.statSync(file.data).size;
      if (!this.contractAttachmentService.validateFileSize(fileSize)) {
        return {
          success: false,
          message: '文件大小不能超过 10MB',
          code: 400,
        };
      }

      // 生成存储路径
      const filePath = this.contractAttachmentService.generateFilePath(
        contractId,
        file.filename
      );

      // 添加调试日志
      console.log('文件上传调试信息:', {
        originalFile: file.data,
        targetPath: filePath,
        originalExists: fs.existsSync(file.data),
        targetDirExists: fs.existsSync(path.dirname(filePath)),
        fileSize: fileSize
      });

      // 确保目标目录存在
      const targetDir = path.dirname(filePath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
        console.log('创建目标目录:', targetDir);
      }

      // 移动文件到目标位置
      try {
        fs.copyFileSync(file.data, filePath);
        console.log('文件复制成功:', filePath);

        // 验证文件是否真的被复制
        if (!fs.existsSync(filePath)) {
          throw new Error('文件复制后不存在于目标位置');
        }

        const copiedFileSize = fs.statSync(filePath).size;
        if (copiedFileSize !== fileSize) {
          throw new Error(`文件大小不匹配: 原始${fileSize}, 复制后${copiedFileSize}`);
        }

      } catch (copyError) {
        console.error('文件复制失败:', copyError);
        throw new Error(`文件保存失败: ${copyError.message}`);
      }

      // 创建附件记录
      const attachment = await this.contractAttachmentService.createAttachment(
        contractId,
        {
          file_name: file.filename,
          file_path: filePath,
          file_type: path.extname(file.filename).toLowerCase(),
          file_size: fileSize,
        }
      );

      console.log('附件记录创建成功:', attachment);

      // 清理临时文件
      try {
        fs.unlinkSync(file.data);
        console.log('临时文件清理成功:', file.data);
      } catch (cleanupError) {
        console.warn('临时文件清理失败:', cleanupError.message);
      }

      return {
        success: true,
        data: attachment,
        message: '文件上传成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '文件上传失败',
        code: 500,
      };
    }
  }

  /**
   * 获取合同附件列表
   */
  @Get('/contracts/:contractId/attachments')
  async getContractAttachments(
    @Param('contractId') contractId: number
  ): Promise<ApiResponse> {
    try {
      const attachments =
        await this.contractAttachmentService.getAttachmentsByContractId(
          contractId
        );

      return {
        success: true,
        data: attachments,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取附件列表失败',
        code: 500,
      };
    }
  }

  /**
   * 删除合同附件
   */
  @Del('/contracts/:contractId/attachments/:attachmentId')
  async deleteContractAttachment(
    @Param('attachmentId') attachmentId: number
  ): Promise<ApiResponse> {
    try {
      const success = await this.contractAttachmentService.deleteAttachment(
        attachmentId
      );

      if (!success) {
        return {
          success: false,
          message: '附件不存在',
          code: 404,
        };
      }

      return {
        success: true,
        message: '附件删除成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '删除附件失败',
        code: 500,
      };
    }
  }

  /**
   * 上传发票附件
   */
  @Post('/invoices/:invoiceId/attachments')
  async uploadInvoiceAttachment(
    @Param('invoiceId') invoiceId: number,
    @Files() files: UploadFileInfo<string>[]
  ): Promise<ApiResponse> {
    try {
      if (!files || files.length === 0) {
        return {
          success: false,
          message: '请选择要上传的文件',
          code: 400,
        };
      }

      const file = files[0];

      // 验证文件类型
      if (!this.invoiceAttachmentService.validateFileType(file.filename)) {
        return {
          success: false,
          message: '不支持的文件类型，仅支持 PDF、JPG、JPEG、PNG 格式',
          code: 400,
        };
      }

      // 验证文件大小
      const fileSize = fs.statSync(file.data).size;
      if (!this.invoiceAttachmentService.validateFileSize(fileSize)) {
        return {
          success: false,
          message: '文件大小不能超过 10MB',
          code: 400,
        };
      }

      // 生成存储路径
      const filePath = this.invoiceAttachmentService.generateFilePath(
        invoiceId,
        file.filename
      );

      // 添加调试日志
      console.log('发票文件上传调试信息:', {
        originalFile: file.data,
        targetPath: filePath,
        originalExists: fs.existsSync(file.data),
        targetDirExists: fs.existsSync(path.dirname(filePath)),
        fileSize: fileSize
      });

      // 确保目标目录存在
      const targetDir = path.dirname(filePath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
        console.log('创建发票目标目录:', targetDir);
      }

      // 移动文件到目标位置
      try {
        fs.copyFileSync(file.data, filePath);
        console.log('发票文件复制成功:', filePath);

        // 验证文件是否真的被复制
        if (!fs.existsSync(filePath)) {
          throw new Error('文件复制后不存在于目标位置');
        }

        const copiedFileSize = fs.statSync(filePath).size;
        if (copiedFileSize !== fileSize) {
          throw new Error(`文件大小不匹配: 原始${fileSize}, 复制后${copiedFileSize}`);
        }

      } catch (copyError) {
        console.error('发票文件复制失败:', copyError);
        throw new Error(`文件保存失败: ${copyError.message}`);
      }

      // 创建附件记录
      const attachment = await this.invoiceAttachmentService.createAttachment(
        invoiceId,
        {
          file_name: file.filename,
          file_path: filePath,
          file_type: path.extname(file.filename).toLowerCase(),
          file_size: fileSize,
        }
      );

      console.log('发票附件记录创建成功:', attachment);

      // 清理临时文件
      try {
        fs.unlinkSync(file.data);
        console.log('发票临时文件清理成功:', file.data);
      } catch (cleanupError) {
        console.warn('发票临时文件清理失败:', cleanupError.message);
      }

      return {
        success: true,
        data: attachment,
        message: '文件上传成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '文件上传失败',
        code: 500,
      };
    }
  }

  /**
   * 获取发票附件列表
   */
  @Get('/invoices/:invoiceId/attachments')
  async getInvoiceAttachments(
    @Param('invoiceId') invoiceId: number
  ): Promise<ApiResponse> {
    try {
      const attachments =
        await this.invoiceAttachmentService.getAttachmentsByInvoiceId(
          invoiceId
        );

      return {
        success: true,
        data: attachments,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取附件列表失败',
        code: 500,
      };
    }
  }

  /**
   * 删除发票附件
   */
  @Del('/invoices/:invoiceId/attachments/:attachmentId')
  async deleteInvoiceAttachment(
    @Param('attachmentId') attachmentId: number
  ): Promise<ApiResponse> {
    try {
      const success = await this.invoiceAttachmentService.deleteAttachment(
        attachmentId
      );

      if (!success) {
        return {
          success: false,
          message: '附件不存在',
          code: 404,
        };
      }

      return {
        success: true,
        message: '附件删除成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '删除附件失败',
        code: 500,
      };
    }
  }

  /**
   * 下载附件文件
   */
  @Get('/attachments/:attachmentId/download')
  async downloadAttachment(
    @Param('attachmentId') attachmentId: number,
    @Query('token') token?: string
  ) {
    try {
      // 验证token（支持查询参数和Authorization头）
      let authToken = token;
      if (!authToken) {
        const authHeader = this.ctx.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          authToken = authHeader.substring(7);
        }
      }

      if (!authToken) {
        this.ctx.status = 401;
        this.ctx.body = { success: false, message: '未授权访问' };
        return;
      }

      // 这里可以添加token验证逻辑
      // 暂时跳过详细验证，实际项目中应该验证token有效性

      // 先尝试从合同附件中查找
      const attachment = await this.contractAttachmentService.getAttachmentById(
        attachmentId
      );
      let fileName = '';
      let filePath = '';

      if (attachment) {
        fileName = attachment.file_name;
        filePath = attachment.file_path;
      } else {
        // 如果没找到，再从发票附件中查找
        const invoiceAttachment =
          await this.invoiceAttachmentService.getAttachmentById(attachmentId);
        if (invoiceAttachment) {
          fileName = invoiceAttachment.file_name;
          filePath = invoiceAttachment.file_path;
        }
      }

      if (!fileName || !filePath) {
        this.ctx.status = 404;
        this.ctx.body = { success: false, message: '附件不存在' };
        return;
      }

      // 添加详细的调试信息
      console.log('文件下载/预览调试信息:', {
        attachmentId,
        fileName,
        filePath,
        fileExists: fs.existsSync(filePath),
        isPreview: !!token,
        uploadDir: process.env.UPLOAD_DIR || '/app/uploads'
      });

      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        console.error('文件不存在:', {
          filePath,
          dirExists: fs.existsSync(path.dirname(filePath)),
          dirContents: fs.existsSync(path.dirname(filePath)) ?
            fs.readdirSync(path.dirname(filePath)) : '目录不存在'
        });

        this.ctx.status = 404;
        this.ctx.body = { success: false, message: '文件不存在' };
        return;
      }

      // 根据文件类型设置Content-Type
      const ext = path.extname(fileName).toLowerCase();
      let contentType = 'application/octet-stream';
      let disposition = 'attachment';

      // 如果是预览请求（通过token参数判断），设置为inline
      if (token) {
        disposition = 'inline';
        switch (ext) {
          case '.pdf':
            contentType = 'application/pdf';
            break;
          case '.jpg':
          case '.jpeg':
            contentType = 'image/jpeg';
            break;
          case '.png':
            contentType = 'image/png';
            break;
          default:
            contentType = 'application/octet-stream';
        }
      }

      // 设置响应头
      this.ctx.set('Content-Type', contentType);
      this.ctx.set(
        'Content-Disposition',
        `${disposition}; filename="${encodeURIComponent(fileName)}"`
      );

      // 返回文件流
      this.ctx.body = fs.createReadStream(filePath);
    } catch (error) {
      this.ctx.status = 500;
      this.ctx.body = {
        success: false,
        message: error.message || '下载文件失败',
      };
    }
  }
}
