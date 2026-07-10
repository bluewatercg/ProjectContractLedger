import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Del,
  Body,
  Param,
  Query,
  Inject,
  Files,
} from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { UploadFileInfo } from '@midwayjs/upload';
import { Validate } from '@midwayjs/validate';
import { ApiTags, ApiOperation } from '@midwayjs/swagger';
import { SubscriptionService } from '../service/subscription.service';
import { SubscriptionRenewalAttachmentService } from '../service/subscription-renewal-attachment.service';
import * as fs from 'fs';
import * as path from 'path';
import {
  ApiResponse,
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  RenewSubscriptionDto,
  CreateSubscriptionTypeDto,
  UpdateSubscriptionTypeDto,
  SubscriptionQuery,
} from '../interface';

@ApiTags(['订阅到期提醒'])
@Controller('/api/v1/subscriptions')
export class SubscriptionController {
  @Inject()
  ctx: Context;

  @Inject()
  subscriptionService: SubscriptionService;

  @Inject()
  subscriptionRenewalAttachmentService: SubscriptionRenewalAttachmentService;

  @Get('/types')
  @ApiOperation({ summary: '获取订阅事项类型字典' })
  async getTypes(@Query('status') status?: 'active' | 'disabled'): Promise<ApiResponse> {
    try {
      const kitId = this.getKitId();
      const types = await this.subscriptionService.getTypes(kitId, status);
      return { success: true, data: types, message: '获取事项类型成功' };
    } catch (error) {
      return this.error(error, '获取事项类型失败');
    }
  }

  @Post('/types')
  @Validate()
  @ApiOperation({ summary: '创建订阅事项类型' })
  async createType(@Body() dto: CreateSubscriptionTypeDto): Promise<ApiResponse> {
    try {
      const type = await this.subscriptionService.createType(dto, this.getKitId(), this.getUserId());
      return { success: true, data: type, message: '创建事项类型成功' };
    } catch (error) {
      return this.error(error, '创建事项类型失败', 400);
    }
  }

  @Put('/types/:id')
  @Validate()
  @ApiOperation({ summary: '更新订阅事项类型' })
  async updateType(@Param('id') id: number, @Body() dto: UpdateSubscriptionTypeDto): Promise<ApiResponse> {
    try {
      const type = await this.subscriptionService.updateType(Number(id), dto, this.getKitId());
      return { success: true, data: type, message: '更新事项类型成功' };
    } catch (error) {
      return this.error(error, '更新事项类型失败', 400);
    }
  }

  @Get('/')
  @ApiOperation({ summary: '获取订阅台账列表' })
  async getSubscriptions(@Query() query: SubscriptionQuery): Promise<ApiResponse> {
    try {
      const result = await this.subscriptionService.getSubscriptions(query || {}, this.getKitId());
      return { success: true, data: result, message: '获取订阅台账成功' };
    } catch (error) {
      return this.error(error, '获取订阅台账失败');
    }
  }

  @Get('/:id')
  @ApiOperation({ summary: '获取订阅详情' })
  async getSubscription(@Param('id') id: number): Promise<ApiResponse> {
    try {
      const subscription = await this.subscriptionService.getSubscriptionById(Number(id), this.getKitId());
      return { success: true, data: subscription, message: '获取订阅详情成功' };
    } catch (error) {
      return this.error(error, '获取订阅详情失败', 404);
    }
  }

  @Post('/')
  @Validate()
  @ApiOperation({ summary: '创建订阅事项' })
  async createSubscription(@Body() dto: CreateSubscriptionDto): Promise<ApiResponse> {
    try {
      const subscription = await this.subscriptionService.createSubscription(dto, this.getKitId(), this.getUserId());
      return { success: true, data: subscription, message: '创建订阅事项成功' };
    } catch (error) {
      return this.error(error, '创建订阅事项失败', 400);
    }
  }

  @Put('/:id')
  @Validate()
  @ApiOperation({ summary: '更新订阅事项' })
  async updateSubscription(@Param('id') id: number, @Body() dto: UpdateSubscriptionDto): Promise<ApiResponse> {
    try {
      const subscription = await this.subscriptionService.updateSubscription(Number(id), dto, this.getKitId(), this.getUserId());
      return { success: true, data: subscription, message: '更新订阅事项成功' };
    } catch (error) {
      return this.error(error, '更新订阅事项失败', 400);
    }
  }

  @Patch('/:id/disable')
  @ApiOperation({ summary: '停用订阅事项' })
  async disableSubscription(@Param('id') id: number): Promise<ApiResponse> {
    try {
      const subscription = await this.subscriptionService.disableSubscription(Number(id), this.getKitId(), this.getUserId());
      return { success: true, data: subscription, message: '停用订阅事项成功' };
    } catch (error) {
      return this.error(error, '停用订阅事项失败', 400);
    }
  }

  @Patch('/:id/enable')
  @ApiOperation({ summary: '启用订阅事项' })
  async enableSubscription(@Param('id') id: number): Promise<ApiResponse> {
    try {
      const subscription = await this.subscriptionService.enableSubscription(Number(id), this.getKitId(), this.getUserId());
      return { success: true, data: subscription, message: '启用订阅事项成功' };
    } catch (error) {
      return this.error(error, '启用订阅事项失败', 400);
    }
  }

  @Post('/:id/renew')
  @Validate()
  @ApiOperation({ summary: '确认订阅已续费' })
  async renewSubscription(@Param('id') id: number, @Body() dto: RenewSubscriptionDto): Promise<ApiResponse> {
    try {
      const user = this.ctx.state?.user;
      const subscription = await this.subscriptionService.renewSubscription(
        Number(id),
        this.getKitId(),
        this.getUserId(),
        dto?.remarks,
        user?.role === 'admin'
      );
      return { success: true, data: subscription, message: '确认续费成功' };
    } catch (error) {
      return this.error(error, '确认续费失败', 403);
    }
  }

  @Get('/:id/renewal-logs')
  @ApiOperation({ summary: '获取订阅续费历史' })
  async getRenewalLogs(@Param('id') id: number): Promise<ApiResponse> {
    try {
      const logs = await this.subscriptionService.getRenewalLogs(Number(id), this.getKitId());
      return { success: true, data: logs, message: '获取续费历史成功' };
    } catch (error) {
      return this.error(error, '获取续费历史失败');
    }
  }

  @Del('/:id/renewal-logs/:renewalLogId')
  @ApiOperation({ summary: '删除订阅续费历史' })
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

  @Get('/renewal-logs/:renewalLogId/attachments')
  @ApiOperation({ summary: '获取订阅续费附件' })
  async getRenewalAttachments(@Param('renewalLogId') renewalLogId: number): Promise<ApiResponse> {
    try {
      const attachments = await this.subscriptionRenewalAttachmentService.getAttachmentsByRenewalLogId(Number(renewalLogId), this.getKitId());
      return { success: true, data: attachments, message: '获取续费附件成功' };
    } catch (error) {
      return this.error(error, '获取续费附件失败');
    }
  }

  @Post('/renewal-logs/:renewalLogId/attachments/:attachmentType')
  @ApiOperation({ summary: '上传订阅续费合同/发票附件' })
  async uploadRenewalAttachment(
    @Param('renewalLogId') renewalLogId: number,
    @Param('attachmentType') attachmentType: 'contract' | 'invoice',
    @Files() files: UploadFileInfo<string>[]
  ): Promise<ApiResponse> {
    try {
      if (!['contract', 'invoice'].includes(attachmentType)) {
        return { success: false, message: '附件类型仅支持合同或发票', code: 400 };
      }
      if (!files || files.length === 0) {
        return { success: false, message: '请选择要上传的文件', code: 400 };
      }

      const file = files[0];
      if (!this.subscriptionRenewalAttachmentService.validateFileType(file.filename)) {
        return { success: false, message: '不支持的文件类型，仅支持 PDF、JPG、JPEG、PNG 格式', code: 400 };
      }

      const fileSize = fs.statSync(file.data).size;
      if (!this.subscriptionRenewalAttachmentService.validateFileSize(fileSize)) {
        return { success: false, message: '文件大小不能超过 10MB', code: 400 };
      }

      const filePath = this.subscriptionRenewalAttachmentService.generateFilePath(Number(renewalLogId), attachmentType, file.filename);
      const targetDir = path.dirname(filePath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      fs.copyFileSync(file.data, filePath);

      const attachment = await this.subscriptionRenewalAttachmentService.createAttachment(
        Number(renewalLogId),
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
        console.warn('订阅续费附件临时文件清理失败:', cleanupError.message);
      }

      return { success: true, data: attachment, message: '文件上传成功' };
    } catch (error) {
      return this.error(error, '文件上传失败', 500);
    }
  }

  @Get('/attachments/:attachmentId/download')
  @ApiOperation({ summary: '下载订阅续费附件' })
  async downloadRenewalAttachment(@Param('attachmentId') attachmentId: number) {
    try {
      const attachment = await this.subscriptionRenewalAttachmentService.getAttachmentById(Number(attachmentId), this.getKitId());
      if (!attachment) {
        this.ctx.status = 404;
        this.ctx.body = { success: false, message: '附件不存在' };
        return;
      }
      if (!fs.existsSync(attachment.file_path)) {
        this.ctx.status = 404;
        this.ctx.body = { success: false, message: '文件不存在' };
        return;
      }

      this.ctx.set('Content-Type', 'application/octet-stream');
      this.ctx.set('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.file_name)}"`);
      this.ctx.body = fs.createReadStream(attachment.file_path);
    } catch (error) {
      this.ctx.status = 500;
      this.ctx.body = { success: false, message: error.message || '下载文件失败' };
    }
  }

  @Del('/attachments/:attachmentId')
  @ApiOperation({ summary: '删除订阅续费附件' })
  async deleteRenewalAttachment(@Param('attachmentId') attachmentId: number): Promise<ApiResponse> {
    try {
      const deleted = await this.subscriptionRenewalAttachmentService.deleteAttachment(Number(attachmentId), this.getKitId());
      if (!deleted) {
        return { success: false, message: '附件不存在', code: 404 };
      }
      return { success: true, message: '附件删除成功' };
    } catch (error) {
      return this.error(error, '附件删除失败', 500);
    }
  }

  @Get('/attachments/:attachmentId/preview')
  @ApiOperation({ summary: '生成订阅续费附件预览链接' })
  async getRenewalAttachmentPreviewUrl(@Param('attachmentId') attachmentId: number): Promise<ApiResponse> {
    try {
      const attachment = await this.subscriptionRenewalAttachmentService.getAttachmentById(Number(attachmentId), this.getKitId());
      if (!attachment) {
        return { success: false, message: '附件不存在', code: 404 };
      }

      return {
        success: true,
        data: { preview_url: `/api/v1/subscriptions/attachments/public-preview?attachmentId=${attachmentId}` },
      };
    } catch (error) {
      return this.error(error, '生成预览链接失败', 500);
    }
  }

  @Get('/attachments/:attachmentId/base64')
  @ApiOperation({ summary: '获取订阅续费 PDF 附件 Base64' })
  async getRenewalAttachmentBase64(@Param('attachmentId') attachmentId: number): Promise<ApiResponse> {
    try {
      const attachment = await this.subscriptionRenewalAttachmentService.getAttachmentById(Number(attachmentId), this.getKitId());
      if (!attachment) {
        return { success: false, message: '附件不存在', code: 404 };
      }

      const ext = path.extname(attachment.file_name).toLowerCase();
      if (ext !== '.pdf') {
        return { success: false, message: '只支持PDF文件的Base64预览', code: 400 };
      }
      if (!fs.existsSync(attachment.file_path)) {
        return { success: false, message: '文件不存在', code: 404 };
      }

      const fileStats = fs.statSync(attachment.file_path);
      const maxSizeForBase64 = 50 * 1024 * 1024;
      if (fileStats.size > maxSizeForBase64) {
        return { success: false, message: 'PDF文件过大，无法进行Base64预览（最大50MB）', code: 413 };
      }

      const fileBuffer = fs.readFileSync(attachment.file_path);
      return {
        success: true,
        data: {
          base64: fileBuffer.toString('base64'),
          contentType: 'application/pdf',
          size: fileBuffer.length,
          fileName: attachment.file_name,
        },
        message: 'PDF Base64数据获取成功',
      };
    } catch (error) {
      return this.error(error, '获取PDF Base64数据失败', 500);
    }
  }

  @Get('/attachments/public-preview')
  @ApiOperation({ summary: '公开预览订阅续费附件' })
  async servePublicRenewalAttachment(@Query('attachmentId') attachmentId: number) {
    try {
      const attachment = await this.subscriptionRenewalAttachmentService.getAttachmentById(Number(attachmentId));
      if (!attachment || !attachment.file_path || !attachment.file_name) {
        this.ctx.status = 404;
        this.ctx.body = { success: false, message: '附件不存在或数据不完整' };
        return;
      }
      if (!fs.existsSync(attachment.file_path)) {
        this.ctx.status = 404;
        this.ctx.body = { success: false, message: '文件不存在' };
        return;
      }

      const ext = path.extname(attachment.file_name).toLowerCase();
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
      this.ctx.set('Content-Disposition', `inline; filename="${encodeURIComponent(attachment.file_name)}"`);
      this.ctx.body = fs.createReadStream(attachment.file_path);
    } catch (error) {
      this.ctx.status = 500;
      this.ctx.body = { success: false, message: error.message || '预览文件失败' };
    }
  }


  private getKitId(): number {
    const kitId = this.ctx.state?.kitId;
    if (!kitId) {
      throw new Error('请选择套账');
    }
    return kitId;
  }

  private getUserId(): number {
    const userId = this.ctx.state?.user?.id;
    if (!userId) {
      throw new Error('请先登录');
    }
    return userId;
  }

  private error(error: any, fallback: string, code = 500): ApiResponse {
    return {
      success: false,
      message: error.message || fallback,
      code,
    };
  }
}
