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
import { Config } from '@midwayjs/core';
import { ContractAttachment } from '../entity/contract-attachment.entity';
import { InvoiceAttachment } from '../entity/invoice-attachment.entity';


@Controller('/api/v1')
export class AttachmentController {
  @Inject()
  contractAttachmentService: ContractAttachmentService;

  @Inject()
  invoiceAttachmentService: InvoiceAttachmentService;

  @Inject()
  ctx: Context;

  @Config('jwt')
  jwtConfig: { secret: string; expiresIn: string };

  @Config('upload')
  uploadConfig: { uploadDir: string };

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
        fileSize: fileSize,
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
          throw new Error(
            `文件大小不匹配: 原始${fileSize}, 复制后${copiedFileSize}`
          );
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
      const success =
        await this.contractAttachmentService.deleteAttachment(attachmentId);

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
        fileSize: fileSize,
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
          throw new Error(
            `文件大小不匹配: 原始${fileSize}, 复制后${copiedFileSize}`
          );
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
      const success =
        await this.invoiceAttachmentService.deleteAttachment(attachmentId);

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
    @Query('token') token?: string,
    @Query('type') type?: 'contract' | 'invoice'
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

      // 根据type参数精确查找附件
      let fileName = '';
      let filePath = '';
      
      if (type === 'contract') {
        // 明确指定查找合同附件
        const attachment = await this.contractAttachmentService.getAttachmentById(attachmentId);
        if (attachment) {
          fileName = attachment.file_name;
          filePath = attachment.file_path;
        }
      } else if (type === 'invoice') {
        // 明确指定查找发票附件
        const attachment = await this.invoiceAttachmentService.getAttachmentById(attachmentId);
        if (attachment) {
          fileName = attachment.file_name;
          filePath = attachment.file_path;
        }
      } else {
        // 如果没有指定类型，则按原来的逻辑查找（为了向后兼容）
        const contractAttachment = await this.contractAttachmentService.getAttachmentById(attachmentId);
        if (contractAttachment) {
          fileName = contractAttachment.file_name;
          filePath = contractAttachment.file_path;
        } else {
          const invoiceAttachment = await this.invoiceAttachmentService.getAttachmentById(attachmentId);
          if (invoiceAttachment) {
            fileName = invoiceAttachment.file_name;
            filePath = invoiceAttachment.file_path;
          }
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
        uploadDir: process.env.UPLOAD_DIR || '/app/uploads',
      });

      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        console.error('文件不存在:', {
          filePath,
          dirExists: fs.existsSync(path.dirname(filePath)),
          dirContents: fs.existsSync(path.dirname(filePath))
            ? fs.readdirSync(path.dirname(filePath))
            : '目录不存在',
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

  /**
   * 生成附件的临时预览 URL
   */
  @Get('/attachments/:attachmentId/preview')
  async getAttachmentPreviewUrl(
    @Param('attachmentId') attachmentId: number
  ): Promise<ApiResponse> {
    try {
      // 同时查找合同附件和发票附件
      const [contractAttachment, invoiceAttachment] = await Promise.all([
        this.contractAttachmentService.getAttachmentById(attachmentId),
        this.invoiceAttachmentService.getAttachmentById(attachmentId)
      ]);
      
      let selectedType: string;
      
      if (contractAttachment && invoiceAttachment) {
        // 如果两种类型都找到了相同ID的附件，这是数据异常
        console.warn('发现ID冲突的附件', {
          attachmentId,
          contractAttachment: contractAttachment.file_name,
          invoiceAttachment: invoiceAttachment.file_name
        });
        // 优先使用合同附件
        selectedType = 'contract';
      } else if (contractAttachment) {
        selectedType = 'contract';
      } else if (invoiceAttachment) {
        selectedType = 'invoice';
      } else {
        return { success: false, message: '附件不存在', code: 404 };
      }

      // 构建公开预览 URL
      const previewUrl = `/api/v1/attachments/public-preview?attachmentId=${attachmentId}&type=${selectedType}`;

      console.log('Generated preview URL:', previewUrl);

      return {
        success: true,
        data: { preview_url: previewUrl },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '生成预览链接失败',
        code: 500,
      };
    }
  }

  /**
   * 获取PDF附件的Base64编码数据（新的预览方案）
   * 临时移除认证，仅用于测试
   */
  @Get('/attachments/:attachmentId/base64')
  async getAttachmentBase64(
    @Param('attachmentId') attachmentId: number,
    @Query('type') type?: 'contract' | 'invoice'
  ): Promise<ApiResponse> {
    try {
      console.log('PDF Base64预览请求 - 无认证模式', {
        attachmentId,
        type,
        timestamp: new Date().toISOString()
      });

      // 验证附件ID的有效性
      if (!attachmentId || attachmentId <= 0) {
        return {
          success: false,
          message: '无效的附件ID',
          code: 400,
        };
      }

      let attachment: ContractAttachment | InvoiceAttachment | null = null;
      let attachmentType = '';
      
      if (type === 'contract') {
        // 明确指定查找合同附件
        attachment = await this.contractAttachmentService.getAttachmentById(attachmentId);
        attachmentType = 'contract';
      } else if (type === 'invoice') {
        // 明确指定查找发票附件
        attachment = await this.invoiceAttachmentService.getAttachmentById(attachmentId);
        attachmentType = 'invoice';
      } else {
        // 如果没有指定类型，则按原来的逻辑查找（为了向后兼容）
        attachment = await this.contractAttachmentService.getAttachmentById(attachmentId);
        if (attachment) {
          attachmentType = 'contract';
        } else {
          attachment = await this.invoiceAttachmentService.getAttachmentById(attachmentId);
          attachmentType = 'invoice';
        }
      }

      if (!attachment) {
        return {
          success: false,
          message: '附件不存在',
          code: 404,
        };
      }

      // 验证文件路径的安全性
      const filePath = attachment.file_path;
      const fileName = attachment.file_name;

      // 确保文件路径在允许的上传目录内，防止路径遍历攻击
      const uploadDir = this.uploadConfig?.uploadDir || '/app/uploads';
      const normalizedFilePath = path.resolve(filePath);
      const normalizedUploadDir = path.resolve(uploadDir);
      
      if (!normalizedFilePath.startsWith(normalizedUploadDir)) {
        console.error('安全警告：检测到潜在的路径遍历攻击', {
          filePath,
          normalizedFilePath,
          uploadDir: normalizedUploadDir
        });
        return {
          success: false,
          message: '文件访问被拒绝',
          code: 403,
        };
      }

      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        console.error('文件不存在', {
          filePath,
          attachmentId
        });
        return {
          success: false,
          message: '文件不存在',
          code: 404,
        };
      }

      // 验证文件类型
      const ext = path.extname(fileName).toLowerCase();
      if (ext !== '.pdf') {
        return {
          success: false,
          message: '只支持PDF文件的Base64预览',
          code: 400,
        };
      }

      // 验证文件大小（防止过大文件导致内存问题）
      const fileStats = fs.statSync(filePath);
      const maxSizeForBase64 = 50 * 1024 * 1024; // 50MB限制
      if (fileStats.size > maxSizeForBase64) {
        return {
          success: false,
          message: 'PDF文件过大，无法进行Base64预览（最大50MB）',
          code: 413,
        };
      }

      // 读取文件并转换为Base64
      const fileBuffer = fs.readFileSync(filePath);
      const base64Data = fileBuffer.toString('base64');

      // 记录访问日志
      console.log('PDF Base64预览成功', {
        attachmentId,
        attachmentType,
        fileName,
        fileSize: fileStats.size,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        data: {
          base64: base64Data,
          contentType: 'application/pdf',
          size: fileBuffer.length,
          fileName: fileName,
        },
        message: 'PDF Base64数据获取成功',
      };
    } catch (error) {
      console.error('获取PDF Base64数据异常', {
        attachmentId,
        error: error.message,
        stack: error.stack
      });
      return {
        success: false,
        message: error.message || '获取PDF Base64数据失败',
        code: 500,
      };
    }
  }

  /**
   * 提供公开的附件预览文件流
   */
  @Get('/attachments/public-preview')
  async servePublicAttachment(
    @Query('attachmentId') attachmentId: number,
    @Query('type') type: 'contract' | 'invoice'
  ) {
    if (!attachmentId || !type) {
      this.ctx.status = 401;
      this.ctx.body = { success: false, message: '缺少访问令牌' };
      return;
    }

    try {
      let attachment;
      // 根据类型精确查找附件
      if (type === 'contract') {
        attachment =
          await this.contractAttachmentService.getAttachmentById(attachmentId);
      } else {
        attachment =
          await this.invoiceAttachmentService.getAttachmentById(attachmentId);
      }

      if (!attachment || !attachment.file_path || !attachment.file_name) {
        this.ctx.status = 404;
        this.ctx.body = { success: false, message: '附件不存在或数据不完整' };
        return;
      }

      const filePath = attachment.file_path;
      const fileName = attachment.file_name;

      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        this.ctx.status = 404;
        this.ctx.body = { success: false, message: '文件不存在' };
        return;
      }

      // 设置响应头以内联方式打开
      const ext = path.extname(fileName).toLowerCase();
      let contentType = 'application/octet-stream';
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
      }

      this.ctx.set('Content-Type', contentType);
      this.ctx.set(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(fileName)}"`
      );

      // 返回文件流
      this.ctx.body = fs.createReadStream(filePath);
    } catch (error) {
      this.ctx.status = 500;
      this.ctx.body = { success: false, message: '预览文件失败' };
    }
  }
}
