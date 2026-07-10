import { Controller, Get, Post, Put, Del, Param, Body, Query, Inject } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { SubscriptionService } from '../service/subscription.service';
import { SubscriptionRenewalRecordService } from '../service/subscription-renewal-record.service';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  SubscriptionQuery,
  ApiResponse,
  CreateSubscriptionRenewalRecordDto,
  UpdateSubscriptionRenewalRecordDto,
} from '../interface';

@Controller('/api/v1/subscriptions')
export class SubscriptionController {
  @Inject()
  ctx: Context;

  @Inject()
  subscriptionService: SubscriptionService;

  @Inject()
  subscriptionRenewalRecordService: SubscriptionRenewalRecordService;

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

  private error(error: Error, defaultMessage: string, defaultCode: number = 400): ApiResponse {
    console.error(defaultMessage, error);
    return {
      success: false,
      message: error.message || defaultMessage,
      code: defaultCode,
    };
  }
}