import { Controller, Get, Post, Put, Del, Param, Body, Query, Inject, Files, Config } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { UploadFileInfo } from '@midwayjs/upload';
import { SubscriptionService } from '../service/subscription.service';
import { SubscriptionRenewalRecordService } from '../service/subscription-renewal-record.service';
import { SubscriptionRenewalAttachmentService } from '../service/subscription-renewal-attachment.service';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  SubscriptionQuery,
  ApiResponse,
  CreateSubscriptionRenewalRecordDto,
  UpdateSubscriptionRenewalRecordDto,
} from '../interface';
import * as fs from 'fs';
import * as path from 'path';

@Controller('/api/v1/subscriptions')
export class SubscriptionController {
  @Inject()
  ctx: Context;

  @Inject()
  subscriptionService: SubscriptionService;

  @Inject()
  subscriptionRenewalRecordService: SubscriptionRenewalRecordService;

  @Inject()
  subscriptionRenewalAttachmentService: SubscriptionRenewalAttachmentService;

  @Config('upload')
  uploadConfig: { uploadDir: string };

  private getKitId(): number {
    return this.ctx.state.kitId;
  }

  private getUserId(): number {
    if (!this.ctx.state.user) {
      throw new Error('请先登录');
    }
    return this.ctx.state.user.id;
  }

  @Get('/')
  async listSubscriptions(@Query() query: SubscriptionQuery): Promise<ApiResponse> {
    try {
      const result = await this.subscriptionService.getSubscriptions(query, this.getKitId());
      return { success: true, data: result, message: '获取订阅列表成功' };
    } catch (error) {
      return this.error(error, '获取订阅列表失败');
    }
  }

  @Get('/:id')
  async getSubscription(@Param('id') id: number): Promise<ApiResponse> {
    try {
      const subscription = await this.subscriptionService.getSubscriptionById(Number(id), this.getKitId());
      return { success: true, data: subscription, message: '获取订阅详情成功' };
    } catch (error) {
      return this.error(error, '获取订阅详情失败');
    }
  }

  @Post('/')
  async createSubscription(@Body() dto: CreateSubscriptionDto): Promise<ApiResponse> {
    try {
      const subscription = await this.subscriptionService.createSubscription(dto, this.getKitId(), this.getUserId());
      return { success: true, data: subscription, message: '创建订阅成功' };
    } catch (error) {
      return this.error(error, '创建订阅失败');
    }
  }

  @Put('/:id')
  async updateSubscription(@Param('id') id: number, @Body() dto: UpdateSubscriptionDto): Promise<ApiResponse> {
    try {
      const subscription = await this.subscriptionService.updateSubscription(Number(id), dto, this.getKitId(), this.getUserId());
      return { success: true, data: subscription, message: '更新订阅成功' };
    } catch (error) {
      return this.error(error, '更新订阅失败');
    }
  }

  @Put('/:id/disable')
  async disableSubscription(@Param('id') id: number): Promise<ApiResponse> {
    try {
      const result = await this.subscriptionService.disableSubscription(Number(id), this.getKitId(), this.getUserId());
      return { success: result, message: result ? '停用订阅成功' : '订阅不存在' };
    } catch (error) {
      return this.error(error, '停用订阅失败');
    }
  }

  @Put('/:id/enable')
  async enableSubscription(@Param('id') id: number): Promise<ApiResponse> {
    try {
      const result = await this.subscriptionService.enableSubscription(Number(id), this.getKitId(), this.getUserId());
      return { success: result, message: result ? '启用订阅成功' : '订阅不存在' };
    } catch (error) {
      return this.error(error, '启用订阅失败');
    }
  }

  @Get('/:id/renewal-records')
  async getRenewalRecords(@Param('id') id: number): Promise<ApiResponse> {
    try {
      const records = await this.subscriptionRenewalRecordService.getRenewalRecordsBySubscription(Number(id), this.getKitId());
      return { success: true, data: records, message: '获取续费记录成功' };
    } catch (error) {
      return this.error(error, '获取续费记录失败');
    }
  }

  @Get('/renewal-records/:recordId')
  async getRenewalRecord(@Param('recordId') recordId: number): Promise<ApiResponse> {
    try {
      const record = await this.subscriptionRenewalRecordService.getRenewalRecord(Number(recordId), this.getKitId());
      return { success: true, data: record, message: '获取续费记录成功' };
    } catch (error) {
      return this.error(error, '获取续费记录失败');
    }
  }

  @Post('/:id/renewal-records')
  async createRenewalRecord(@Param('id') id: number, @Body() dto: CreateSubscriptionRenewalRecordDto): Promise<ApiResponse> {
    try {
      const record = await this.subscriptionRenewalRecordService.createRenewalRecord(Number(id), dto, this.getKitId(), this.getUserId());
      return { success: true, data: record, message: '创建续费记录成功' };
    } catch (error) {
      return this.error(error, '创建续费记录失败');
    }
  }

  @Put('/renewal-records/:recordId')
  async updateRenewalRecord(@Param('recordId') recordId: number, @Body() dto: UpdateSubscriptionRenewalRecordDto): Promise<ApiResponse> {
    try {
      const record = await this.subscriptionRenewalRecordService.updateRenewalRecord(Number(recordId), dto, this.getKitId());
      return { success: true, data: record, message: '更新续费记录成功' };
    } catch (error) {
      return this.error(error, '更新续费记录失败');
    }
  }

  @Del('/renewal-records/:recordId')
  async deleteRenewalRecord(@Param('recordId') recordId: number): Promise<ApiResponse> {
    try {
      const deleted = await this.subscriptionRenewalRecordService.deleteRenewalRecord(Number(recordId), this.getKitId());
      if (!deleted) {
        return { success: false, message: '续费记录不存在', code: 404 };
      }
      return { success: true, message: '删除续费记录成功' };
    } catch (error) {
      return this.error(error, '删除续费记录失败', 500);
    }
  }



  @Get('/renewal-records/:recordId/attachments')
  async getRenewalRecordAttachments(@Param('recordId') recordId: number): Promise<ApiResponse> {
    try {
      const attachments = await this.subscriptionRenewalAttachmentService.getAttachmentsByRenewalRecordId(Number(recordId), this.getKitId());
      return { success: true, data: attachments, message: '获取续费附件成功' };
    } catch (error) {
      return this.error(error, '获取续费附件失败');
    }
  }

  @Post('/renewal-records/:recordId/attachments')
  async uploadRenewalRecordAttachment(
    @Param('recordId') recordId: number,
    @Query('attachment_type') attachmentType: 'contract' | 'invoice',
    @Files() files: UploadFileInfo<string>[]
  ): Promise<ApiResponse> {
    try {
      if (!files || files.length === 0) {
        return { success: false, message: '请选择要上传的文件', code: 400 };
      }

      if (!['contract', 'invoice'].includes(attachmentType)) {
        return { success: false, message: '附件类型不正确', code: 400 };
      }

      await this.subscriptionRenewalRecordService.getRenewalRecord(Number(recordId), this.getKitId());
      const file = files[0];

      if (!this.subscriptionRenewalAttachmentService.validateFileType(file.filename)) {
        return { success: false, message: '不支持的文件类型，仅支持 PDF、JPG、JPEG、PNG 格式', code: 400 };
      }

      const fileSize = fs.statSync(file.data).size;
      if (!this.subscriptionRenewalAttachmentService.validateFileSize(fileSize)) {
        return { success: false, message: '文件大小不能超过 10MB', code: 400 };
      }

      const filePath = this.subscriptionRenewalAttachmentService.generateFilePath(Number(recordId), attachmentType, file.filename);
      const targetDir = path.dirname(filePath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      fs.copyFileSync(file.data, filePath);

      const attachment = await this.subscriptionRenewalAttachmentService.createAttachmentByRenewalRecordId(
        Number(recordId),
        this.getKitId(),
        attachmentType,
        this.getUserId(),
        {
          file_name: file.filename,
          file_path: filePath,
          file_type: path.extname(file.filename).toLowerCase(),
          file_size: fileSize,
        }
      );

      try {
        fs.unlinkSync(file.data);
      } catch (cleanupError) {
        console.warn('临时文件清理失败:', cleanupError.message);
      }

      return { success: true, data: attachment, message: '附件上传成功' };
    } catch (error) {
      return this.error(error, '附件上传失败', 500);
    }
  }

  @Get('/attachments/:attachmentId/preview')
  async previewRenewalAttachment(@Param('attachmentId') attachmentId: number): Promise<void> {
    const attachment = await this.subscriptionRenewalAttachmentService.getAttachmentById(Number(attachmentId), this.getKitId());
    if (!attachment || !fs.existsSync(attachment.file_path)) {
      this.ctx.status = 404;
      this.ctx.body = '附件不存在';
      return;
    }

    this.ctx.set('Content-Type', this.getContentType(attachment.file_type || attachment.file_name));
    this.ctx.set('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(attachment.file_name)}`);
    this.ctx.body = fs.createReadStream(attachment.file_path);
  }

  @Del('/attachments/:attachmentId')
  async deleteRenewalAttachment(@Param('attachmentId') attachmentId: number): Promise<ApiResponse> {
    try {
      const deleted = await this.subscriptionRenewalAttachmentService.deleteAttachment(Number(attachmentId), this.getKitId());
      if (!deleted) {
        return { success: false, message: '附件不存在', code: 404 };
      }
      return { success: true, message: '附件已删除' };
    } catch (error) {
      return this.error(error, '删除附件失败', 500);
    }
  }

  @Get('/:id/renewal-logs')
  async getRenewalLogs(@Param('id') id: number): Promise<ApiResponse> {
    try {
      const logs = await this.subscriptionService.getRenewalLogs(Number(id), this.getKitId());
      return { success: true, data: logs, message: '获取续费历史成功' };
    } catch (error) {
      return this.error(error, '获取续费历史失败');
    }
  }

  @Del('/:id/renewal-logs/:renewalLogId')
  async deleteRenewalLog(@Param('id') id: number, @Param('renewalLogId') renewalLogId: number): Promise<ApiResponse> {
    try {
      const deleted = await this.subscriptionService.deleteRenewalLog(Number(id), Number(renewalLogId), this.getKitId());
      if (!deleted) {
        return { success: false, message: '续费历史不存在', code: 404 };
      }
      return { success: true, message: '续费历史删除成功' };
    } catch (error) {
      return this.error(error, '删除续费历史失败', 500);
    }
  }

  @Post('/:id/renew')
  async renewSubscription(@Param('id') id: number, @Body() body: { renewal_date?: string; next_reminder_date?: string; remind_days_before?: number; reminder_mode?: 'daily' | 'once'; fee?: number; renewal_method?: string; remarks?: string }): Promise<ApiResponse> {
    try {
      const result = await this.subscriptionService.renewSubscription(Number(id), body, this.getKitId(), this.getUserId());
      return { success: true, data: result, message: '续费成功' };
    } catch (error) {
      return this.error(error, '续费失败');
    }
  }

  private getContentType(fileType: string): string {
    const ext = fileType.startsWith('.') ? fileType.toLowerCase() : path.extname(fileType).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
    };
    return contentTypes[ext] || 'application/octet-stream';
  }

  private error(error: Error, defaultMessage: string, defaultCode: number = 400): ApiResponse {
    console.error(defaultMessage, error);
    return {
      success: false,
      message: error.message || defaultMessage,
      code: defaultCode,
    };
  }
}